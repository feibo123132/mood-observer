const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const zlib = require('zlib');

// ============================================================================
// PART 1: Protocol Definitions (Enums)
// ============================================================================

const EventType = {
  None: 0,
  StartConnection: 1,
  FinishConnection: 2,
  ConnectionStarted: 50,
  ConnectionFailed: 51,
  ConnectionFinished: 52,
  StartSession: 100,
  CancelSession: 101,
  FinishSession: 102,
  SessionStarted: 150,
  SessionCanceled: 151,
  SessionFinished: 152,
  SessionFailed: 153,
  UsageResponse: 154,
  TaskRequest: 200,
  UpdateConfig: 201,
  AudioMuted: 250,
  SayHello: 300,
  TTSSentenceStart: 350,
  TTSSentenceEnd: 351,
  TTSResponse: 352,
  TTSEnded: 359,
  PodcastRoundStart: 360,
  PodcastRoundResponse: 361,
  PodcastRoundEnd: 362,
  PodcastEnd: 363,
  ASRInfo: 450,
  ASRResponse: 451,
  ASREnded: 459,
  ChatTTSText: 500,
  ChatResponse: 550,
  ChatEnded: 559,
  SourceSubtitleStart: 650,
  SourceSubtitleResponse: 651,
  SourceSubtitleEnd: 652,
  TranslationSubtitleStart: 653,
  TranslationSubtitleResponse: 654,
  TranslationSubtitleEnd: 655,
};

const MsgType = {
  Invalid: 0,
  FullClientRequest: 0b1,
  AudioOnlyClient: 0b10,
  FullServerResponse: 0b1001,
  AudioOnlyServer: 0b1011,
  FrontEndResultServer: 0b1100,
  Error: 0b1111,
};

const MsgTypeFlagBits = {
  NoSeq: 0,
  PositiveSeq: 0b1,
  LastNoSeq: 0b10,
  NegativeSeq: 0b11,
  WithEvent: 0b100,
};

const VersionBits = {
  Version1: 1,
};

const HeaderSizeBits = {
  HeaderSize4: 1,
};

const SerializationBits = {
  Raw: 0,
  JSON: 0b1,
  Thrift: 0b11,
  Custom: 0b1111,
};

const CompressionBits = {
  None: 0,
  Gzip: 0b1,
  Custom: 0b1111,
};

// ============================================================================
// PART 2: Helpers
// ============================================================================

function getEventTypeName(eventType) {
  for (const [key, value] of Object.entries(EventType)) {
    if (value === eventType) return key;
  }
  return `UnknownEvent(${eventType})`;
}

function getMsgTypeName(msgType) {
  for (const [key, value] of Object.entries(MsgType)) {
    if (value === msgType) return key;
  }
  return `UnknownMsgType(${msgType})`;
}

// Create a default Message object
function createMessage(msgType, flag) {
  return {
    type: msgType,
    flag: flag,
    version: VersionBits.Version1,
    headerSize: HeaderSizeBits.HeaderSize4,
    serialization: SerializationBits.JSON,
    compression: CompressionBits.None,
    payload: Buffer.alloc(0),
    // Optional fields
    event: undefined,
    sessionId: undefined,
    connectId: undefined,
    sequence: undefined,
    errorCode: undefined,
  };
}

// ============================================================================
// PART 3: Marshal / Unmarshal (Protocol Logic)
// ============================================================================

// --- Writers ---

function writeEvent(msg) {
  if (msg.event === undefined) return null;
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(msg.event);
  return buffer;
}

function writeSessionId(msg) {
  if (msg.event === undefined) return null;

  switch (msg.event) {
    case EventType.StartConnection:
    case EventType.FinishConnection:
    case EventType.ConnectionStarted:
    case EventType.ConnectionFailed:
      return null;
  }

  const sessionId = msg.sessionId || '';
  const sessionIdBytes = Buffer.from(sessionId, 'utf8');
  const result = Buffer.alloc(4 + sessionIdBytes.length);
  result.writeUInt32BE(sessionIdBytes.length, 0);
  sessionIdBytes.copy(result, 4);
  return result;
}

function writeSequence(msg) {
  if (msg.sequence === undefined) return null;
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(msg.sequence);
  return buffer;
}

function writeErrorCode(msg) {
  if (msg.errorCode === undefined) return null;
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(msg.errorCode);
  return buffer;
}

function writePayload(msg) {
  const payloadSize = msg.payload.length;
  const result = Buffer.alloc(4 + payloadSize);
  result.writeUInt32BE(payloadSize, 0);
  msg.payload.copy(result, 4);
  return result;
}

function getWriters(msg) {
  const writers = [];

  if (msg.flag === MsgTypeFlagBits.WithEvent) {
    writers.push(writeEvent, writeSessionId);
  }

  switch (msg.type) {
    case MsgType.AudioOnlyClient:
    case MsgType.AudioOnlyServer:
    case MsgType.FrontEndResultServer:
    case MsgType.FullClientRequest:
    case MsgType.FullServerResponse:
      if (
        msg.flag === MsgTypeFlagBits.PositiveSeq ||
        msg.flag === MsgTypeFlagBits.NegativeSeq
      ) {
        writers.push(writeSequence);
      }
      break;
    case MsgType.Error:
      writers.push(writeErrorCode);
      break;
    default:
      // throw new Error(`unsupported message type: ${msg.type}`);
      // Tolerant fallback: ignore specific fields for unknown types but still write payload
      break;
  }

  writers.push(writePayload);
  return writers;
}

function marshalMessage(msg) {
  const buffers = [];

  // Build base header (4 bytes)
  const headerSize = 4 * msg.headerSize;
  const header = Buffer.alloc(headerSize);

  header[0] = (msg.version << 4) | msg.headerSize;
  header[1] = (msg.type << 4) | msg.flag;
  header[2] = (msg.serialization << 4) | msg.compression;
  // header[3] is reserved (0)

  buffers.push(header);

  const writers = getWriters(msg);
  for (const writer of writers) {
    const data = writer(msg);
    if (data) buffers.push(data);
  }

  return Buffer.concat(buffers);
}

// --- Readers ---

function readEvent(msg, data, offset) {
  if (offset + 4 > data.length) throw new Error('insufficient data for event');
  msg.event = data.readInt32BE(offset);
  return offset + 4;
}

function readSessionId(msg, data, offset) {
  if (msg.event === undefined) return offset;

  switch (msg.event) {
    case EventType.StartConnection:
    case EventType.FinishConnection:
    case EventType.ConnectionStarted:
    case EventType.ConnectionFailed:
    case EventType.ConnectionFinished:
      return offset;
  }

  if (offset + 4 > data.length) throw new Error('insufficient data for session ID size');
  const size = data.readUInt32BE(offset);
  offset += 4;

  if (size > 0) {
    if (offset + size > data.length) throw new Error('insufficient data for session ID');
    msg.sessionId = data.toString('utf8', offset, offset + size);
    offset += size;
  }
  return offset;
}

function readConnectId(msg, data, offset) {
  if (msg.event === undefined) return offset;

  switch (msg.event) {
    case EventType.ConnectionStarted:
    case EventType.ConnectionFailed:
    case EventType.ConnectionFinished:
      break;
    default:
      return offset;
  }

  if (offset + 4 > data.length) throw new Error('insufficient data for connect ID size');
  const size = data.readUInt32BE(offset);
  offset += 4;

  if (size > 0) {
    if (offset + size > data.length) throw new Error('insufficient data for connect ID');
    msg.connectId = data.toString('utf8', offset, offset + size);
    offset += size;
  }
  return offset;
}

function readSequence(msg, data, offset) {
  if (offset + 4 > data.length) throw new Error('insufficient data for sequence');
  msg.sequence = data.readInt32BE(offset);
  return offset + 4;
}

function readErrorCode(msg, data, offset) {
  if (offset + 4 > data.length) throw new Error('insufficient data for error code');
  msg.errorCode = data.readUInt32BE(offset);
  return offset + 4;
}

function readPayload(msg, data, offset) {
  if (offset + 4 > data.length) throw new Error('insufficient data for payload size');
  const size = data.readUInt32BE(offset);
  offset += 4;

  if (size > 0) {
    if (offset + size > data.length) throw new Error('insufficient data for payload');
    msg.payload = data.slice(offset, offset + size);
    
    // Auto decompress if needed
    if (msg.compression === CompressionBits.Gzip) {
       try {
         msg.payload = zlib.gunzipSync(msg.payload);
       } catch (e) {
         console.error('Decompression error:', e);
       }
    }
    
    offset += size;
  } else {
    msg.payload = Buffer.alloc(0);
  }
  return offset;
}

function getReaders(msg) {
  const readers = [];

  switch (msg.type) {
    case MsgType.AudioOnlyClient:
    case MsgType.AudioOnlyServer:
    case MsgType.FrontEndResultServer:
    case MsgType.FullClientRequest:
    case MsgType.FullServerResponse:
      if (
        msg.flag === MsgTypeFlagBits.PositiveSeq ||
        msg.flag === MsgTypeFlagBits.NegativeSeq
      ) {
        readers.push(readSequence);
      }
      break;
    case MsgType.Error:
      readers.push(readErrorCode);
      break;
  }

  if (msg.flag === MsgTypeFlagBits.WithEvent) {
    readers.push(readEvent, readSessionId, readConnectId);
  }

  readers.push(readPayload);
  return readers;
}

function unmarshalMessage(data) {
  if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data);
  }
  
  if (data.length < 3) throw new Error(`data too short: ${data.length}`);

  let offset = 0;
  const versionAndHeaderSize = data[offset++];
  const typeAndFlag = data[offset++];
  const serializationAndCompression = data[offset++];

  const msg = {
    version: versionAndHeaderSize >> 4,
    headerSize: versionAndHeaderSize & 0b00001111,
    type: typeAndFlag >> 4,
    flag: typeAndFlag & 0b00001111,
    serialization: serializationAndCompression >> 4,
    compression: serializationAndCompression & 0b00001111,
    payload: Buffer.alloc(0),
  };

  offset = 4 * msg.headerSize; // Skip header

  const readers = getReaders(msg);
  for (const reader of readers) {
    offset = reader(msg, data, offset);
  }

  return msg;
}

// ============================================================================
// PART 4: Connection & Flow Logic
// ============================================================================

const messageQueues = new Map();
const messageCallbacks = new Map();

function setupMessageHandler(ws) {
  if (!messageQueues.has(ws)) {
    messageQueues.set(ws, []);
    messageCallbacks.set(ws, []);

    ws.on('message', (data) => {
      try {
        const msg = unmarshalMessage(data);
        const queue = messageQueues.get(ws);
        const callbacks = messageCallbacks.get(ws);

        if (callbacks && callbacks.length > 0) {
          const callback = callbacks.shift();
          callback(msg);
        } else if (queue) {
          queue.push(msg);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      messageQueues.delete(ws);
      messageCallbacks.delete(ws);
    });
  }
}

function ReceiveMessage(ws) {
  setupMessageHandler(ws);
  return new Promise((resolve, reject) => {
    const queue = messageQueues.get(ws);
    const callbacks = messageCallbacks.get(ws);

    if (queue && queue.length > 0) {
      resolve(queue.shift());
      return;
    }

    const errorHandler = (error) => {
       // Cleanup logic could be here
       reject(error);
    };

    const resolver = (msg) => {
      ws.removeListener('error', errorHandler);
      resolve(msg);
    };

    if (callbacks) callbacks.push(resolver);
    ws.once('error', errorHandler);
  });
}

async function WaitForEvent(ws, msgType, eventType) {
  // Simple timeout to prevent infinite wait
  let resolved = false;
  return new Promise(async (resolve, reject) => {
      setTimeout(() => {
          if(!resolved) reject(new Error(`Timeout waiting for event ${getEventTypeName(eventType)}`));
      }, 30000);

      try {
        while(true) {
            const msg = await ReceiveMessage(ws);
            if (msg.type === msgType && msg.event === eventType) {
                resolved = true;
                resolve(msg);
                return;
            }
            // If we receive Error msg
            if (msg.type === MsgType.Error) {
                 resolved = true;
                 const errMsg = msg.payload.toString('utf8');
                 reject(new Error(`Server returned error: ${errMsg} (Code: ${msg.errorCode})`));
                 return;
            }
            console.log(`Ignoring message type=${getMsgTypeName(msg.type)}, event=${getEventTypeName(msg.event)} while waiting for ${getEventTypeName(eventType)}`);
        }
      } catch (e) {
          if(!resolved) reject(e);
      }
  });
}

// --- Action Wrappers ---

function send(ws, msg) {
  const data = marshalMessage(msg);
  return new Promise((resolve, reject) => {
    ws.send(data, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function StartConnection(ws) {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent);
  msg.event = EventType.StartConnection;
  msg.payload = Buffer.from('{}', 'utf8');
  console.log('Sending StartConnection...');
  await send(ws, msg);
}

async function FinishConnection(ws) {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent);
  msg.event = EventType.FinishConnection;
  msg.payload = Buffer.from('{}', 'utf8');
  console.log('Sending FinishConnection...');
  await send(ws, msg);
}

async function StartSession(ws, payloadBuffer, sessionId) {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent);
  msg.event = EventType.StartSession;
  msg.sessionId = sessionId;
  msg.payload = payloadBuffer;
  console.log('Sending StartSession...');
  await send(ws, msg);
}

async function FinishSession(ws, sessionId) {
  const msg = createMessage(MsgType.FullClientRequest, MsgTypeFlagBits.WithEvent);
  msg.event = EventType.FinishSession;
  msg.sessionId = sessionId;
  msg.payload = Buffer.from('{}', 'utf8');
  console.log('Sending FinishSession...');
  await send(ws, msg);
}

// ============================================================================
// PART 5: Main Cloud Function
// ============================================================================

const tcb = require('@cloudbase/node-sdk');

const cloud = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('Function generatePodcast invoked');
  
  const { text, year, week } = event;
  if (!text) return { success: false, error: 'Missing text input' };

  // 0. Check if file exists in Storage (Idempotency)
  // File path: reports/podcast_{year}_{week}.mp3
  if (year && week) {
    const cloudPath = `reports/podcast_${year}_${week}.mp3`;
    try {
      const res = await cloud.getTempFileURL({
        fileList: [cloudPath]
      });
      // Check if file exists (status code 0 means success)
      if (res.fileList && res.fileList[0] && res.fileList[0].status === 0) {
        console.log('Found existing podcast:', res.fileList[0].tempFileURL);
        return {
          success: true,
          audioUrl: res.fileList[0].tempFileURL,
          isCached: true
        };
      }
    } catch (e) {
      console.log('Cache check failed, proceeding to generate:', e);
    }
  }

  // 1. Env Check
  const APPID = process.env.VOLC_APPID;
  const TOKEN = process.env.VOLC_TOKEN;
  const SERVICE_TYPE = 'volc.service_type.10050';

  if (!APPID || !TOKEN) return { success: false, error: 'Missing credentials' };

  // 2. Setup WebSocket
  const wsUrl = 'wss://openspeech.bytedance.com/api/v3/sami/podcasttts';
  const headers = {
    'X-Api-App-Id': APPID,
    'X-Api-App-Key': 'aGjiRdfUWi',
    'X-Api-Access-Key': TOKEN,
    'X-Api-Resource-Id': SERVICE_TYPE,
    'X-Api-Connect-Id': uuidv4(),
  };

  // Masked debug log
  console.log('Connecting with headers:', { ...headers, 'X-Api-Access-Key': '****' });

  const ws = new WebSocket(wsUrl, {
    headers,
    skipUTF8Validation: true // Critical for binary protocol
  });

  // Prepare Audio Buffer Collection
  const audioChunks = [];
  let isPodcastRoundEnd = true;
  let lastRoundID = -1;
  let taskID = '';
  
  // Create a master promise for the whole flow
  return new Promise(async (resolve, reject) => {
    
    // Global Timeout
    const timeoutHandle = setTimeout(() => {
        ws.terminate();
        resolve({ success: false, error: 'Global Timeout (300s)' });
    }, 300000);

    try {
        // Wait for Open
        await new Promise((res, rej) => {
            ws.once('open', res);
            ws.once('error', rej);
        });
        console.log('WebSocket Connected');

        // --- Handshake ---
        await StartConnection(ws);
        await WaitForEvent(ws, MsgType.FullServerResponse, EventType.ConnectionStarted);
        console.log('Connection Started');

        // --- Session Request ---
        const sessionID = uuidv4();
        taskID = sessionID;

        const reqParams = {
            input_text: text,
            action: 0, // 0: Auto summarize & generate
            speaker_info: { random_order: false }, // Default
            audio_config: {
                format: 'mp3',
                sample_rate: 24000,
                speech_rate: 0
            },
            input_info: {
                return_audio_url: true // We still ask for it, just in case
            }
        };

        const reqPayload = Buffer.from(JSON.stringify(reqParams), 'utf8');

        await StartSession(ws, reqPayload, sessionID);
        await WaitForEvent(ws, MsgType.FullServerResponse, EventType.SessionStarted);
        console.log('Session Started');

        // --- Signal End of Session (Start Streaming) ---
        await FinishSession(ws, sessionID);
        console.log('Session Finished (Signaled)');

        // --- Receive Loop ---
        while (true) {
            const msg = await ReceiveMessage(ws);
            // console.log(`Received Msg: Type=${getMsgTypeName(msg.type)} Event=${getEventTypeName(msg.event)} Size=${msg.payload.length}`);

            // 1. Audio Data
            if (msg.type === MsgType.AudioOnlyServer) {
                 if (msg.event === EventType.PodcastRoundResponse) {
                     audioChunks.push(msg.payload);
                    //  console.log(`Audio Chunk: ${msg.payload.length} bytes`);
                 }
            }
            
            // 2. Control Messages
            if (msg.type === MsgType.FullServerResponse) {
                if (msg.event === EventType.PodcastRoundStart) {
                    const meta = JSON.parse(msg.payload.toString('utf8'));
                    console.log(`Round Start: ${meta.round_id} Speaker: ${meta.speaker}`);
                    isPodcastRoundEnd = false;
                }
                else if (msg.event === EventType.PodcastRoundEnd) {
                    console.log('Round End');
                    isPodcastRoundEnd = true;
                }
                else if (msg.event === EventType.PodcastEnd) {
                    const meta = JSON.parse(msg.payload.toString('utf8'));
                    console.log('Podcast End:', meta);
                    // Check if meta has url
                    if (meta.audio_url) {
                        console.log('URL found in PodcastEnd metadata!');
                        // If we got a URL, we can prioritize returning it
                        // But let's finish the loop properly
                    }
                }
            }
            
            // 3. Session Finished
            if (msg.event === EventType.SessionFinished) {
                console.log('Server signaled SessionFinished');
                break;
            }
        }

        // --- Teardown ---
        await FinishConnection(ws);
        await WaitForEvent(ws, MsgType.FullServerResponse, EventType.ConnectionFinished);
        console.log('Connection Gracefully Closed');
        
        ws.close();
        clearTimeout(timeoutHandle);

        // --- Output ---
        const totalAudio = Buffer.concat(audioChunks);
        console.log(`Total Audio Size: ${totalAudio.length} bytes`);
        
        if (totalAudio.length > 0) {
            // Upload to Cloud Storage if year/week provided
            if (year && week) {
                const cloudPath = `reports/podcast_${year}_${week}.mp3`;
                try {
                    console.log('Uploading to Storage:', cloudPath);
                    await cloud.uploadFile({
                        cloudPath: cloudPath,
                        fileContent: totalAudio,
                    });
                    
                    const res = await cloud.getTempFileURL({
                        fileList: [cloudPath]
                    });
                    
                    if (res.fileList && res.fileList[0] && res.fileList[0].status === 0) {
                        resolve({
                            success: true,
                            audioUrl: res.fileList[0].tempFileURL
                        });
                        return;
                    }
                } catch (uploadErr) {
                    console.error('Upload failed, falling back to base64:', uploadErr);
                }
            }

            // Fallback: Return Base64
            const base64Audio = totalAudio.toString('base64');
            const dataUri = `data:audio/mp3;base64,${base64Audio}`;
            resolve({
                success: true,
                audioUrl: dataUri // Return Base64 Data URI directly
            });
        } else {
            resolve({
                success: false,
                error: 'No audio data received'
            });
        }
    } catch (err) {
        console.error('Flow Error:', err);
        ws.close();
        clearTimeout(timeoutHandle);
        resolve({
            success: false,
            error: `Process failed: ${err.message}`
        });
    }
  });
};
