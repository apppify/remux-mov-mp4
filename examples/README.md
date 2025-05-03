# MOV to MP4 Remuxer Demo

This folder contains a simple HTML demo that showcases the functionality of the `remux-mov-mp4` library.

## Running the Demo

### Option 1: Directly Open the HTML File

1. First build the library:

   ```
   npm run build
   ```

2. Then open `index.html` in a web browser.

### Option 2: Using a Local Server

For better compatibility with ES modules and avoiding CORS issues:

1. Build the library:

   ```
   npm run build
   ```

2. Start a local web server. You can use any of these methods:
   - Using Node.js and http-server:
     ```
     npx http-server -o examples
     ```
   - Using Python:
     ```
     python -m http.server
     ```
     Then navigate to http://localhost:8000/examples/

## Using the Demo

1. Select a .mov file using the file input
2. Click the "Convert to MP4" button
3. After conversion, you'll see:
   - A video preview of the converted file
   - A download link for the MP4 file
   - Information about the conversion (file size, time taken)

## Notes

- This demo uses ES modules to import the library
- Conversion happens entirely in the browser
- No data is sent to any server
- Only H.264 video and AAC audio codecs are supported

## Troubleshooting

If you encounter issues:

- Check the browser console for detailed error messages
- Ensure you're using a modern browser with ES module support
- Make sure the MOV file uses H.264/AAC codecs
- Try a smaller test file if conversion is slow
