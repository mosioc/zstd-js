import { ZstdInit, ZstdCodec } from '@oneidentity/zstd-js';

class ZstdProcessor {
    constructor() {
        this.codec = null;
        this.dictionary = null;
        this.performanceMetrics = {
            compressionTime: 0,
            decompressionTime: 0,
            originalSize: 0,
            compressedSize: 0
        };
    }

    async init() {
        try {
            this.codec = await ZstdInit();
            console.log('ZSTD library initialized successfully');
        } catch (error) {
            throw new Error(`Failed to initialize ZSTD: ${error.message}`);
        }
    }

    createDictionary(sampleData) {
        this.dictionary = sampleData.slice(0, Math.min(sampleData.length, 1024));
        console.log('Created dictionary of size:', this.dictionary.length);
        return this.dictionary;
    }

    async compressWithProgress(data, options = {}, progressCallback = null) {
        const { level = 5, useStream = false, useDictionary = false, chunkSize = 1024 * 1024 } = options;
        
        if (!this.codec) throw new Error('ZSTD not initialized');
        
        const startTime = performance.now();
        let compressedData;
        
        try {
            if (useStream) {
                compressedData = await this.streamCompress(data, level, useDictionary, chunkSize, progressCallback);
            } else {
                compressedData = useDictionary 
                    ? this.codec.ZstdSimple.compress(data, level, this.dictionary)
                    : this.codec.ZstdSimple.compress(data, level);
            }
            
            this.performanceMetrics.compressionTime = performance.now() - startTime;
            this.performanceMetrics.originalSize = data.length;
            this.performanceMetrics.compressedSize = compressedData.length;
            
            return compressedData;
        } catch (error) {
            throw new Error(`Compression failed: ${error.message}`);
        }
    }

    async streamCompress(data, level, useDictionary, chunkSize, progressCallback) {
        const chunks = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const compressedChunk = useDictionary
                ? this.codec.ZstdStream.compress(chunk, level, true, this.dictionary)
                : this.codec.ZstdStream.compress(chunk, level, true);
            chunks.push(compressedChunk);
            
            if (progressCallback) {
                const progress = Math.min((i + chunkSize) / data.length, 1);
                progressCallback(progress, compressedChunk.length);
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        return result;
    }

    async decompress(compressedData, useDictionary = false) {
        if (!this.codec) throw new Error('ZSTD not initialized');
        
        const startTime = performance.now();
        try {
            const decompressedData = useDictionary
                ? this.codec.ZstdStream.decompress(compressedData, this.dictionary)
                : this.codec.ZstdStream.decompress(compressedData);
                
            this.performanceMetrics.decompressionTime = performance.now() - startTime;
            return decompressedData;
        } catch (error) {
            throw new Error(`Decompression failed: ${error.message}`);
        }
    }

    getMetrics() {
        return {
            ...this.performanceMetrics,
            compressionRatio: this.performanceMetrics.originalSize / 
                (this.performanceMetrics.compressedSize || 1)
        };
    }
}

async function runZstdExample() {
    try {
        const processor = new ZstdProcessor();
        await processor.init();

        const dataSize = 5 * 1024 * 1024;
        const sampleData = new Uint8Array(dataSize);
        for (let i = 0; i < dataSize; i++) {
            sampleData[i] = Math.random() < 0.5 ? i % 256 : 0;
        }

        processor.createDictionary(sampleData);

        const progressCallback = (progress, chunkSize) => {
            console.log(`Compression progress: ${(progress * 100).toFixed(2)}%, Chunk size: ${chunkSize} bytes`);
        };

        const compressedData = await processor.compressWithProgress(sampleData, {
            level: 9, 
            useStream: true,
            useDictionary: true,
            chunkSize: 512 * 1024
        }, progressCallback);

        console.log('Compression completed. Metrics:', processor.getMetrics());

        const decompressedData = await processor.decompress(compressedData, true);

        const isValid = decompressedData.every((byte, i) => byte === sampleData[i]);
        console.log('Decompression verification:', isValid ? 'Success' : 'Failed');

    } catch (error) {
        console.error('Error in ZSTD processing:', error.message);
    }
}

runZstdExample();
