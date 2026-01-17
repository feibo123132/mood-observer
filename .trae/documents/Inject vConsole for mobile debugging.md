I will inject the vConsole script into `index.html` to enable mobile debugging.

**Plan:**

1.  **Modify `index.html`**:
    *   Add the vConsole CDN script tag inside the `<head>` tag.
    *   Add the initialization script `<script>var vConsole = new VConsole();</script>` immediately after it.

This will display the green vConsole button on mobile devices, allowing you to view error logs and diagnose the white screen issue.
