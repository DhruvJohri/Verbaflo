document.getElementById('generate-btn').addEventListener('click', async () => {
    const apiKey = document.getElementById('api-key').value;
    const pdfFile = document.getElementById('pdf-file').files[0];
    const output = document.getElementById('output');
    const resumeContainer = document.getElementById('resume-container');

    if (!apiKey) {
        output.textContent = "Please provide your OpenAI API key.";
        return;
    }

    if (!pdfFile) {
        output.textContent = "Please upload a LinkedIn PDF file.";
        return;
    }

    try {
        // Clear any previous output or resume
        output.textContent = '';
        resumeContainer.innerHTML = '';

        // Read the PDF and extract the text
        const extractedText = await extractTextFromPDF(pdfFile);

        if (extractedText) {
            // Call OpenAI API to generate HTML resume
            const htmlResume = await generateHTMLResume(apiKey, extractedText);
            if (htmlResume) {
                resumeContainer.innerHTML = htmlResume;
            } else {
                output.textContent = "Could not generate resume. Please try again.";
            }
        } else {
            output.textContent = "Failed to extract text from the PDF.";
        }

    } catch (error) {
        output.textContent = `Error: ${error.message}`;
    }
});

// Function to extract text from the PDF using pdf-lib
async function extractTextFromPDF(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = async function (event) {
            const uint8Array = new Uint8Array(event.target.result);
            const pdfDoc = await PDFLib.PDFDocument.load(uint8Array);
            const textArray = [];

            for (let i = 0; i < pdfDoc.getPageCount(); i++) {
                const page = pdfDoc.getPage(i);
                const text = await page.getTextContent();
                textArray.push(text.items.map((item) => item.str).join(' '));
            }

            resolve(textArray.join(' '));
        };

        reader.onerror = function () {
            reject(new Error("Failed to read PDF file"));
        };

        reader.readAsArrayBuffer(file);
    });
}

// Function to generate HTML resume using OpenAI API
async function generateHTMLResume(apiKey, extractedText) {
    const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "text-davinci-003",
            prompt: `Create an HTML resume from the following LinkedIn profile text: ${extractedText}`,
            max_tokens: 1500
        })
    });

    const data = await response.json();

    if (response.ok) {
        return data.choices[0].text;
    } else {
        throw new Error(data.error.message);
    }
}
