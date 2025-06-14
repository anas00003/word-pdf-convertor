const express = require('express');
const fileUpload = require('express-fileupload');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const LIBREOFFICE_PATH = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(fileUpload());
app.use(express.static('public'));

app.post('/convert', async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send('No file uploaded');
    }

    const file = req.files.file;
    const fileExt = path.extname(file.name).toLowerCase();
    if (!['.doc', '.docx'].includes(fileExt)) {
        return res.status(400).send('Only .doc and .docx files are allowed');
    }

    const timestamp = Date.now();
    const inputFilename = `input_${timestamp}${fileExt}`;
    const inputPath = path.join(UPLOAD_DIR, inputFilename);
    const outputDir = path.resolve(UPLOAD_DIR);

    try {
        await file.mv(inputPath);

        const command = `"${LIBREOFFICE_PATH}" --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
        console.log(`Running: ${command}`);

        exec(command, (error, stdout, stderr) => {
            console.log('LibreOffice STDOUT:', stdout);
            console.log('LibreOffice STDERR:', stderr);

            if (error) {
                console.error('LibreOffice Error:', error.message);
                return res.status(500).send('LibreOffice conversion failed');
            }

            // LibreOffice outputs file with original name and .pdf extension
            const outputFile = path.join(outputDir, path.basename(inputPath, fileExt) + '.pdf');

            if (!fs.existsSync(outputFile)) {
                return res.status(500).send('PDF not created');
            }

            res.download(outputFile, 'converted.pdf', (err) => {
                if (err) console.error('Send error:', err);
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputFile);
            });
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).send('Server error during conversion');
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Upload directory: ${path.resolve(UPLOAD_DIR)}`);
});
