let personImageFile = null;
let costumeImageFile = null;
let resultImageData = null;

// Preview person image
document.getElementById('personImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        personImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('personPreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Person">`;
        };
        reader.readAsDataURL(file);
    }
});

// Preview costume image
document.getElementById('costumeImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        costumeImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('costumePreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Costume">`;
        };
        reader.readAsDataURL(file);
    }
});

// Click on preview to upload
document.getElementById('personPreview').addEventListener('click', function() {
    document.getElementById('personImage').click();
});

document.getElementById('costumePreview').addEventListener('click', function() {
    document.getElementById('costumeImage').click();
});

// Generate image
async function generateImage() {
    const errorDiv = document.getElementById('errorMessage');
    const resultSection = document.getElementById('resultSection');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');

    // Hide previous results and errors
    errorDiv.style.display = 'none';
    resultSection.style.display = 'none';

    // Validation
    if (!personImageFile || !costumeImageFile) {
        errorDiv.textContent = 'Please upload both images!';
        errorDiv.style.display = 'block';
        return;
    }

    // Disable button and show loading
    generateBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
        const formData = new FormData();
        formData.append('personImage', personImageFile);
        formData.append('costumeImage', costumeImageFile);

        const response = await fetch('/generate', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Show result
            resultImageData = data.image;
            document.getElementById('resultImage').src = data.image;
            resultSection.style.display = 'block';

            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            throw new Error(data.error || 'Failed to generate image');
        }
    } catch (error) {
        errorDiv.textContent = `Error: ${error.message}`;
        errorDiv.style.display = 'block';
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
}

// Download image
function downloadImage() {
    if (!resultImageData) return;

    const link = document.createElement('a');
    link.href = resultImageData;
    link.download = `dress_changed_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}