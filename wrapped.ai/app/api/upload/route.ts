import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import process from 'process';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const email = formData.get('email') as string | null;

    if (!file || !email) {
      return NextResponse.json({ error: 'File and email are required' }, { status: 400 });
    }

    // Create a temporary file path
    const tempFilePath = path.join(tmpdir(), file.name);

    // Save the uploaded file to the temporary directory
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);

    console.log(`File saved to ${tempFilePath}, starting processing for ${email}...`);

    // Resolve the absolute path to the Python script
    const scriptPath = path.resolve(process.cwd(), '..', 'claude_parser.py');
    console.log(`Executing python script at: ${scriptPath}`);

    // Execute the Python script
    const pythonProcess = spawn('python3', [scriptPath, tempFilePath, email]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`python: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`python error: ${data}`);
    });

    // We can either wait for the process to finish or respond immediately
    // For a better UX, we can respond immediately and let the script run
    const processPromise = new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
            // Clean up the temporary file
            fs.unlink(tempFilePath).catch(console.error);

            if (code === 0) {
                console.log(`Python script finished successfully for ${email}.`);
                resolve(true);
            } else {
                console.error(`Python script exited with code ${code} for ${email}.`);
                reject(new Error(`Processing failed with code ${code}`));
            }
        });
    });

    // If you want to wait for the script to finish before responding:
    // await processPromise;
    // return NextResponse.json({ message: 'Processing complete' });

    // Respond immediately
    return NextResponse.json({ message: 'File upload received, processing started.' });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
} 