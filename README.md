# ZstdProcessor: Advanced Zstandard Compression in JavaScript

This project provides a robust JavaScript implementation of the Zstandard (Zstd) compression algorithm using the `@oneidentity/zstd-js` library. It offers both simple and streaming compression/decompression with dictionary support, progress tracking, and performance metrics.

## Features

- **Class-based Architecture**: Encapsulates Zstd functionality in a `ZstdProcessor` class for modularity and reusability.
- **Dictionary Compression**: Supports dictionary-based compression for improved ratios on similar data.
- **Streaming Support**: Processes large datasets in chunks to optimize memory usage, with progress callbacks.
- **Performance Metrics**: Tracks compression/decompression time, sizes, and compression ratio.
- **Flexible Configuration**: Adjustable compression levels, chunk sizes, and dictionary usage.
- **Robust Error Handling**: Manages initialization, compression, and decompression errors gracefully.
- **Browser and Node.js Compatibility**: Uses WebAssembly for high performance in modern browsers and Node.js.

## Prerequisites

- Node.js (version 12 or higher) for running in a Node environment.
- Modern browser (Chrome, Firefox, Edge) for browser-based usage.
- `@oneidentity/zstd-js` package installed via npm.

## Installation

Install the required dependency:

```bash
npm install @oneidentity/zstd-js
```

## Usage

The `ZstdProcessor` class provides methods for compression and decompression. Below is a basic example to get started:

### Example

```javascript
import { ZstdProcessor } from './zstd_advanced.js';

async function runExample() {
    try {
        // Initialize processor
        const processor = new ZstdProcessor();
        await processor.init();

        // Create sample data (1MB)
        const data = new Uint8Array(1024 * 1024).map((_, i) => i % 256);

        // Create dictionary
        processor.createDictionary(data);

        // Compress with streaming and progress tracking
        const progressCallback = (progress, chunkSize) => {
            console.log(`Progress: ${(progress * 100).toFixed(2)}%, Chunk: ${chunkSize} bytes`);
        };

        const compressed = await processor.compressWithProgress(data, {
            level: 9,
            useStream: true,
            useDictionary: true,
            chunkSize: 512 * 1024
        }, progressCallback);

        // Decompress
        const decompressed = await processor.decompress(compressed, true);

        // Verify and log metrics
        const isValid = decompressed.every((byte, i) => byte === data[i]);
        console.log('Verification:', isValid ? 'Success' : 'Failed');
        console.log('Metrics:', processor.getMetrics());
    } catch (error) {
        console.error('Error:', error.message);
    }
}

runExample();
```

### Key Methods

- **`init()`**: Initializes the Zstd library asynchronously.
- **`createDictionary(sampleData)`**: Creates a compression dictionary from sample data (simplified implementation).
- **`compressWithProgress(data, options, progressCallback)`**: Compresses data with optional streaming, dictionary, and progress tracking.
  - `options`: `{ level: number, useStream: boolean, useDictionary: boolean, chunkSize: number }`
- **`decompress(compressedData, useDictionary)`**: Decompresses data with optional dictionary support.
- **`getMetrics()`**: Returns performance metrics (compression/decompression time, sizes, ratio).

### Configuration Options

- `level`: Compression level (-7 to 22, default: 3). Higher levels increase compression but are slower.
- `useStream`: Enable streaming mode for large datasets (default: false).
- `useDictionary`: Use dictionary-based compression (default: false).
- `chunkSize`: Size of chunks for streaming (default: 1MB).

## Performance Considerations

- **Compression Levels**: Level 9 is used in the example for good compression. Use -7 for speed or 22 for maximum compression.
- **Streaming**: Recommended for large datasets (>1MB) to prevent memory issues.
- **Dictionary**: Improves compression for similar data but requires representative sample data.
- **WebAssembly**: Ensures high performance in browsers and Node.js.

## Limitations

- The dictionary implementation is simplified (uses first 1KB of input). For production, use Zstd's native dictionary builder.
- Streaming decompression is not implemented in this example but can be added using `ZstdStream`.
- Advanced Zstd parameters (windowLog, chainLog, etc.) require native bindings.

## Extending the Implementation

To enhance this implementation, consider:

- Using native Zstd bindings for advanced dictionary creation (`zstd_createCDict`).
- Implementing concurrent chunk compression with Web Workers.
- Adding support for custom Zstd parameters via native bindings.
- Integrating external dictionary training tools for optimal compression.

## References

- [Zstandard Official Manual](https://facebook.github.io/zstd/zstd_manual.html)
- [@oneidentity/zstd-js npm Package](https://www.npmjs.com/package/@oneidentity/zstd-js)
