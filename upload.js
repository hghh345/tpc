/* -------------------------------- */
/* TINY PHOTO CLUB */
/* upload.js */
/* -------------------------------- */


/* ------------------------------ */
/* Package */
/* ------------------------------ */

const selectedPack =
    parseInt(
        sessionStorage.getItem("tpc_pack") || "12",
        10
    );

const TARGET_COUNT =
    selectedPack === 36 ? 36 : 12;


/* ------------------------------ */
/* Elements */
/* ------------------------------ */

const upload =
    document.querySelector("#photo-upload");

const gallery =
    document.querySelector("#gallery");

const counter =
    document.querySelector("#counter");

const strip =
    document.querySelector("#selected-strip");

const complete =
    document.querySelector("#complete");

const dozenMessage =
    document.querySelector("#dozen-message");

const uploadBox =
    document.querySelector("#upload-box");


/* ------------------------------ */
/* IndexedDB */
/* ------------------------------ */

const DB_NAME =
    "tiny-photo-club";

const DB_VERSION =
    3;

const STORE_NAME =
    "photos";


function openDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded =
            function () {

                const db =
                    request.result;


                if (
                    !db.objectStoreNames.contains(
                        "photos"
                    )
                ) {

                    db.createObjectStore(
                        "photos",
                        {
                            keyPath:
                                "id"
                        }
                    );

                }


                if (
                    !db.objectStoreNames.contains(
                        "selection"
                    )
                ) {

                    db.createObjectStore(
                        "selection",
                        {
                            keyPath:
                                "id"
                        }
                    );

                }

            };


        request.onsuccess =
            function () {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function () {

                reject(
                    request.error
                );

            };

    });

}


/* ------------------------------ */
/* Save Photo */
/* ------------------------------ */
async function savePhoto(file) {

    const db =
        await openDatabase();

    const id =
        crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) +
              Math.random().toString(36).slice(2);

    const arrayBuffer =
        await file.arrayBuffer();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            store.put({

                id:
                    id,

                blob:
                    arrayBuffer,

                name:
                    file.name || "photo.jpg",

                type:
                    file.type || "image/jpeg"

            });

            transaction.oncomplete =
                function () {

                    resolve(id);

                };

            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


/* ------------------------------ */
/* Get Photo */
/* ------------------------------ */

async function getPhoto(id) {

    const db =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            const request =
                store.get(id);

            request.onsuccess =
                function () {

                    const record =
                        request.result;

                    if (!record) {

                        resolve(
                            undefined
                        );

                        return;

                    }

                    const blob =
                        new Blob(
                            [
                                record.blob
                            ],
                            {
                                type:
                                    record.type ||
                                    "image/jpeg"
                            }
                        );

                    resolve({
                        ...record,
                        blob:
                            blob
                    });

                };

            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}

/* ------------------------------ */
/* Get All Photos */
/* ------------------------------ */

async function getAllPhotos() {

    const db =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    STORE_NAME
                );

            const request =
                store.getAll();

            request.onsuccess =
                function () {

                    const records =
                        request.result || [];

                    const photos =
                        records.map(
                            function (record) {

                                const blob =
                                    record.blob instanceof Blob
                                        ? record.blob
                                        : new Blob(
                                            [
                                                record.blob
                                            ],
                                            {
                                                type:
                                                    record.type ||
                                                    "image/jpeg"
                                            }
                                        );

                                return {
                                    ...record,
                                    blob:
                                        blob
                                };

                            }
                        );

                    resolve(
                        photos
                    );

                };

            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}

/* ------------------------------ */
/* Get Selection */
/* ------------------------------ */

async function getSelection() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "selection",
                    "readonly"
                );


            const store =
                transaction.objectStore(
                    "selection"
                );


            const request =
                store.get(
                    "current"
                );


            request.onsuccess =
                function () {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


/* ------------------------------ */
/* Save Selection */
/* ------------------------------ */

async function saveSelection() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "selection",
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    "selection"
                );


            store.put({

                id:
                    "current",

                photos:
                    selectedPhotos

            });


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


/* ------------------------------ */
/* Selected Prints */
/* ------------------------------ */

let selectedPhotos = [];


/*
   Each item is a photo ID.

   The same ID can appear more than once.

   Example:

   photo A
   photo A
   photo B

   = 3 physical prints.
*/


/* ------------------------------ */
/* Prepare Uploaded Photo */
/* ------------------------------ */

async function preparePhoto(file) {

    const isHEIC =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");


    let sourceBlob =
        file;


    if (isHEIC) {

        try {

            const converted =
                await heic2any({

                    blob:
                        file,

                    toType:
                        "image/jpeg",

                    quality:
                        0.92

                });


            sourceBlob =
                Array.isArray(converted)
                    ? converted[0]
                    : converted;

        }

        catch (error) {

            console.error(
                "HEIC conversion failed:",
                error
            );

            throw new Error(
                "HEIC photo could not be converted."
            );

        }

    }


    const image =
        new Image();


    const imageUrl =
        URL.createObjectURL(
            sourceBlob
        );


    try {

        await new Promise(
            (resolve, reject) => {

                image.onload =
                    resolve;

                image.onerror =
                    reject;

                image.src =
                    imageUrl;

            }
        );


        const MAX_SIZE =
            1400;


        let width =
            image.naturalWidth;


        let height =
            image.naturalHeight;


        if (
            width > MAX_SIZE ||
            height > MAX_SIZE
        ) {

            const scale =
                Math.min(
                    MAX_SIZE / width,
                    MAX_SIZE / height
                );


            width =
                Math.round(
                    width * scale
                );


            height =
                Math.round(
                    height * scale
                );

        }


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            width;


        canvas.height =
            height;


        const context =
            canvas.getContext(
                "2d"
            );


        context.drawImage(
            image,
            0,
            0,
            width,
            height
        );


        const resizedBlob =
            await new Promise(
                (resolve, reject) => {

                    canvas.toBlob(
                        function (blob) {

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Could not create photo."
                                    )
                                );

                                return;

                            }


                            resolve(
                                blob
                            );

                        },
                        "image/jpeg",
                        0.82
                    );

                }
            );


        return resizedBlob;

    }

    finally {

        URL.revokeObjectURL(
            imageUrl
        );

    }

}


/* ------------------------------ */
/* Add Uploaded File */
/* ------------------------------ */

async function addUploadedFile(file) {

    if (
        !file.type.startsWith("image/") &&
        !file.name.toLowerCase().endsWith(".heic") &&
        !file.name.toLowerCase().endsWith(".heif")
    ) {

        return;

    }

    let photoBlob;

    try {

        photoBlob =
            await preparePhoto(
                file
            );

    }

    catch (error) {

        console.error(
            "Photo preparation failed:",
            error
        );

        alert(
            "this photo couldn't be processed ♡ please try another photo."
        );

        return;

    }

  let id;

try {

    id =
        await savePhoto(
            photoBlob
        );

}

catch (error) {

    console.error(
        "Photo save failed:",
        error
    );

    alert(
        "this photo couldn't be added: " +
        error.message
    );

    return;

}
    const photo =
        document.createElement(
            "div"
        );

    photo.className =
        "photo";

    const image =
        document.createElement(
            "img"
        );

    const previewUrl =
        URL.createObjectURL(
            photoBlob
        );

    image.src =
        previewUrl;

    image.alt =
        "uploaded photo";

    photo.appendChild(
        image
    );

    photo.dataset.id =
        id;

    photo.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            addPrint(
                photo
            );

        }
    );

    gallery.appendChild(
        photo
    );

}


/* ------------------------------ */
/* Upload Photos */
/* ------------------------------ */

upload.addEventListener(
    "change",
    async function (event) {
        

        const files =
            [
                ...event.target.files
            ];


        for (
            const file
            of files
        ) {

            await addUploadedFile(
                file
            );

        }


        upload.value =
            "";

    }
);


/* ------------------------------ */
/* Add A Print */
/* ------------------------------ */

function addPrint(photo) {

    if (
        selectedPhotos.length >=
        TARGET_COUNT
    ) {

        showFullMessage();

        return;

    }


    const id =
        photo.dataset.id;


    selectedPhotos.push(
        id
    );


    updateUI();

}


/* ------------------------------ */
/* Remove A Print */
/* ------------------------------ */

function removePrint(index) {

    selectedPhotos.splice(
        index,
        1
    );


    updateUI();

}


/* ------------------------------ */
/* Update Everything */
/* ------------------------------ */

async function updateUI() {

    await saveSelection();


    counter.textContent =
        `${selectedPhotos.length} / ${TARGET_COUNT}`;


    strip.innerHTML =
        "";


    for (
        let index = 0;
        index < selectedPhotos.length;
        index++
    ) {

        const id =
            selectedPhotos[index];


        const storedPhoto =
            await getPhoto(
                id
            );


        if (!storedPhoto) {

            continue;

        }


        const slot =
            document.createElement(
                "div"
            );


        slot.className =
            "slot";


        const image =
            document.createElement(
                "img"
            );


        const previewUrl =
            URL.createObjectURL(
                storedPhoto.blob
            );


        image.src =
            previewUrl;


        image.alt =
            `selected print ${index + 1}`;


        const removeButton =
            document.createElement(
                "button"
            );


        removeButton.className =
            "remove-print";


        removeButton.type =
            "button";


        removeButton.setAttribute(
            "aria-label",
            "remove print"
        );


        removeButton.textContent =
            "×";


        removeButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                removePrint(
                    index
                );

            }
        );


        slot.appendChild(
            image
        );


        slot.appendChild(
            removeButton
        );


        strip.appendChild(
            slot
        );

    }


    if (
        selectedPhotos.length ===
        TARGET_COUNT
    ) {

        showFullMessage();


        complete.classList.add(
            "show"
        );

    }

    else {

        if (dozenMessage) {

            dozenMessage.textContent =
                "";

        }


        complete.classList.remove(
            "show"
        );

    }

}


/* ------------------------------ */
/* Prints Are Full */
/* ------------------------------ */

function showFullMessage() {

    if (!dozenMessage) {

        return;

    }


    const word =
        TARGET_COUNT === 36
            ? "36 prints"
            : "12 prints";


    dozenMessage.textContent =
        `your ${word} are full ♡ ↓ scroll down to keep going`;

}


/* ------------------------------ */
/* Drag & Drop */
/* ------------------------------ */

uploadBox.addEventListener(
    "dragover",
    function (e) {

        e.preventDefault();


        uploadBox.style.background =
            "#f5f5f5";

    }
);


uploadBox.addEventListener(
    "dragleave",
    function () {

        uploadBox.style.background =
            "white";

    }
);


uploadBox.addEventListener(
    "drop",
    async function (e) {

        e.preventDefault();


        uploadBox.style.background =
            "white";


        const files =
            [
                ...e.dataTransfer.files
            ];


        for (
            const file
            of files
        ) {

            await addUploadedFile(
                file
            );

        }

    }
);


/* -------------------------- */
/* PRINT PREVIEW SLIDESHOW */
/* -------------------------- */

const printImages = [

    "i1.JPG",
    "i2.JPG",
    "i3.JPG",
    "i4.JPG",
    "i5.JPG",
    "i6.JPG",
    "i7.JPG",
    "i8.JPG",
    "i9.JPG",
    "i10.JPG",
    "i11.JPG",
    "i12.JPG"

].sort(
    () =>
        Math.random() - 0.5
);


let printIndex =
    0;


const printSlide =
    document.querySelector(
        "#print-slideshow"
    );


if (printSlide) {

    setInterval(
        function () {

            printIndex++;


            if (
                printIndex >=
                printImages.length
            ) {

                printIndex =
                    0;

            }


            printSlide.src =
                printImages[
                    printIndex
                ];

        },
        500
    );

}


/* ------------------------------ */
/* Restore Photo Bank */
/* ------------------------------ */

async function restorePhotoBank() {

    const photos =
        await getAllPhotos();

    for (
        const storedPhoto
        of photos
    ) {

        const photo =
            document.createElement(
                "div"
            );

        photo.className =
            "photo";

        const image =
            document.createElement(
                "img"
            );

        const blob =
            storedPhoto.blob instanceof Blob
                ? storedPhoto.blob
                : new Blob(
                    [
                        storedPhoto.blob
                    ],
                    {
                        type:
                            storedPhoto.type ||
                            "image/jpeg"
                    }
                );

        const previewUrl =
            URL.createObjectURL(
                blob
            );

        image.src =
            previewUrl;

        image.alt =
            "uploaded photo";

        photo.appendChild(
            image
        );

        photo.dataset.id =
            storedPhoto.id;

        photo.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                addPrint(
                    photo
                );

            }
        );

        gallery.appendChild(
            photo
        );

    }

    const savedSelection =
        await getSelection();

    if (
        savedSelection &&
        savedSelection.photos
    ) {

        selectedPhotos =
            savedSelection.photos;

        if (
            selectedPhotos.length >
            TARGET_COUNT
        ) {

            selectedPhotos =
                selectedPhotos.slice(
                    0,
                    TARGET_COUNT
                );

        }

        await updateUI();

    }

}


/* ------------------------------ */
/* Mark Ready For Checkout */
/* ------------------------------ */

async function markReadyForCheckout() {

    const db =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    "selection",
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    "selection"
                );


            store.put({

                id:
                    "current",

                photos:
                    selectedPhotos,

                status:
                    "checkout"

            });


            transaction.oncomplete =
                function () {

                    resolve();

                };


            transaction.onerror =
                function () {

                    reject(
                        transaction.error
                    );

                };

        }
    );

}


/* ------------------------------ */
/* Continue Button */
/* ------------------------------ */

const continueButton =
    document.querySelector(
        "#continue-button"
    );


if (continueButton) {

    continueButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            if (
                selectedPhotos.length !==
                TARGET_COUNT
            ) {

                return;

            }


            await markReadyForCheckout();


            window.location.href =
                "checkout.html";

        }
    );

}


/* ------------------------------ */
/* Start */
/* ------------------------------ */

restorePhotoBank();