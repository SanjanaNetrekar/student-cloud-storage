// ==========================================
// STUDENT CLOUD STORAGE
// AWS S3 + Amazon Cognito
// ==========================================

// AWS configuration
const REGION = "eu-north-1";

const IDENTITY_POOL_ID =
    "eu-north-1:ff7d74c1-849b-42db-b28e-17a34c10e445";

const BUCKET_NAME = "sanjana-student-notes-2026";


// ==========================================
// Configure AWS
// ==========================================

AWS.config.update({
    region: REGION,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: IDENTITY_POOL_ID
    })
});

const s3 = new AWS.S3({
    region: REGION
});


// ==========================================
// Get HTML elements
// ==========================================

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileList = document.getElementById("fileList");
const message = document.getElementById("message");


// ==========================================
// Load files when website opens
// ==========================================

window.addEventListener("load", function () {
    loadFiles();
});


// ==========================================
// UPLOAD FILE
// ==========================================

uploadBtn.addEventListener("click", async function () {

    const file = fileInput.files[0];

    if (!file) {
        message.textContent = "Please choose a file first.";
        return;
    }

    try {

        uploadBtn.disabled = true;
        uploadBtn.textContent = "Uploading...";
        message.textContent = "Uploading to AWS S3...";

        // Get temporary Cognito credentials
        await AWS.config.credentials.getPromise();

        const params = {
            Bucket: BUCKET_NAME,
            Key: file.name,
            Body: file,
            ContentType: file.type || "application/octet-stream"
        };

        await s3.upload(params).promise();

        message.textContent = "✅ File uploaded successfully!";

        fileInput.value = "";

        // Refresh file list
        loadFiles();

    } catch (error) {

        console.error("UPLOAD ERROR:", error);

        message.textContent =
            "❌ Upload failed: " + error.message;

    } finally {

        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload to Cloud";
    }

});


// ==========================================
// LOAD FILES FROM S3
// ==========================================

async function loadFiles() {

    fileList.innerHTML = "<p>Loading files from AWS...</p>";

    try {

        // Get temporary credentials
        await AWS.config.credentials.getPromise();

        const params = {
            Bucket: BUCKET_NAME
        };

        const data = await s3.listObjectsV2(params).promise();

        fileList.innerHTML = "";

        if (!data.Contents || data.Contents.length === 0) {

            fileList.innerHTML =
                "<p>No files uploaded yet.</p>";

            return;
        }

        data.Contents.forEach(function (file) {

            const div = document.createElement("div");

            div.className = "file";

            const name = document.createElement("span");

            name.textContent = "📄 " + file.Key;

            const downloadButton =
                document.createElement("button");

            downloadButton.textContent = "Download";

            downloadButton.onclick = function () {
                downloadFile(file.Key);
            };

            const deleteButton =
                document.createElement("button");

            deleteButton.textContent = "Delete";

            deleteButton.onclick = function () {
                deleteFile(file.Key);
            };

            div.appendChild(name);
            div.appendChild(downloadButton);
            div.appendChild(deleteButton);

            fileList.appendChild(div);

        });

    } catch (error) {

        console.error("LOAD FILES ERROR:", error);

        fileList.innerHTML =
            "<p>❌ Could not load files from AWS S3.</p>";

        console.error(error);
    }
}


// ==========================================
// DOWNLOAD FILE
// ==========================================

async function downloadFile(fileName) {

    try {

        await AWS.config.credentials.getPromise();

        const params = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Expires: 300
        };

        const url = s3.getSignedUrl(
            "getObject",
            params
        );

        window.open(url, "_blank");

    } catch (error) {

        console.error("DOWNLOAD ERROR:", error);

        alert(
            "Download failed: " +
            error.message
        );

    }

}


// ==========================================
// DELETE FILE
// ==========================================

async function deleteFile(fileName) {

    const confirmDelete = confirm(
        "Are you sure you want to delete:\n\n" +
        fileName +
        "?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        await AWS.config.credentials.getPromise();

        const params = {
            Bucket: BUCKET_NAME,
            Key: fileName
        };

        await s3.deleteObject(params).promise();

        alert("✅ File deleted successfully!");

        loadFiles();

    } catch (error) {

        console.error("DELETE ERROR:", error);

        alert(
            "Delete failed: " +
            error.message
        );

    }

}