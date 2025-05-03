import fs from "fs";
import path from "path";
import { remuxMovToMp4 } from "./dist/index.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function testRemux() {
  try {
    console.log("Loading video file...");
    const inputPath = path.resolve("./assets/Video.mov");
    const outputPath = path.resolve("./assets/output.mp4");

    // Read file
    const fileBuffer = fs.readFileSync(inputPath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    console.log(`Loaded file: ${fileBuffer.length} bytes`);

    // Run the remux
    console.log("Remuxing MOV to MP4...");
    const result = await remuxMovToMp4(arrayBuffer);

    console.log(`Remuxing complete! Output size: ${result.length} bytes`);

    // Write the result
    fs.writeFileSync(outputPath, result);
    console.log(`Output saved to: ${outputPath}`);

    // Analyze the output file with ffprobe
    await analyzeWithFFProbe(outputPath);
  } catch (error) {
    console.error("Error during remux:", error);
  }
}

async function analyzeWithFFProbe(filePath) {
  try {
    console.log("\nAnalyzing output file with ffprobe...");
    const { stdout } = await execAsync(`ffprobe -i ${filePath} 2>&1`);
    console.log("FFProbe Analysis:");
    console.log(stdout);

    // Check if there's evidence the file is a valid MP4
    if (
      stdout.includes("major_brand     : mp42") &&
      stdout.includes("Input #0, mov,mp4,m4a,3gp,3g2,mj2")
    ) {
      console.log("\n✅ The output file appears to be a valid MP4 file");
    } else {
      console.log("\n⚠️ The output file may have format issues");
    }
  } catch (error) {
    console.error("Error analyzing file:", error.message);
  }
}

testRemux();
