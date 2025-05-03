# mov-to-mp4-remuxer

> Tiny ESM library to remux `.mov` → `.mp4` in the browser without re‑encoding

## 🚀 Features

- **Zero re-encoding**: Pure container-level remux.
- **Tiny footprint**: ~5 KB gzipped.
- **ESModule**: Plug into any modern frontend build.
- **No WASM**: Just JavaScript + Typed Arrays.

## 📦 Installation

```bash
npm install mov-to-mp4-remuxer
# or
yarn add mov-to-mp4-remuxer
```

## 🔧 Usage

```js
import { remuxMovToMp4 } from "mov-to-mp4-remuxer";

const movArrayBuffer = await fetch("video.mov").then((r) => r.arrayBuffer());
const mp4Bytes = await remuxMovToMp4(movArrayBuffer);

// Create a Blob for playback
const mp4Blob = new Blob([mp4Bytes], { type: "video/mp4" });
const url = URL.createObjectURL(mp4Blob);
const video = document.createElement("video");
video.src = url;
video.controls = true;
document.body.appendChild(video);
```

## 🛠 API

### `async remuxMovToMp4(buffer: ArrayBuffer): Promise<Uint8Array>`

- **buffer**: Input `.mov` file as `ArrayBuffer`.
- **returns**: `Uint8Array` containing remuxed `.mp4` bytes.
- **throws**: `ParseError`, `UnsupportedCodecError`, `InvalidInputError`.

## 📚 Supported Codecs & Containers

- **Container**: `.mov` (ISO BMFF compatible)
- **Video**: H.264
- **Audio**: AAC

Unsupported: ProRes, HEVC, fragmented tracks, edit-lists.

## 🧪 Testing

```bash
npm test
```

## 📦 Bundling

Built with **Tsup** targeting ESM:

```bash
npm run build
```

## 🤝 Contributing

1. Fork the repo
2. Create a branch
3. Submit a PR

## 📜 License

[MIT](LICENSE)
