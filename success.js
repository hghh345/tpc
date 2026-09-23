const params =
    new URLSearchParams(
        window.location.search
    );


const sessionId =
    params.get("session_id");


/* -------------------------- */
/* IndexedDB */
/* -------------------------- */

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


/* -------------------------- */
/* Get Selected Photos */
/* -------------------------- */

async function getSelection() {

    const db =
        await openDatabase();


    return new Promise((resolve, reject) => {

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
            store.get("current");


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


/* -------------------------- */
/* Get Photo */
/* -------------------------- */

async function getPhoto(id) {

    const db =
        await openDatabase();

    return new Promise((resolve, reject) => {

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

    });

}


/* -------------------------- */
/* File → Base64 */
/* -------------------------- */

function fileToDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();


        reader.onload =
            function () {

                resolve(
                    reader.result
                );

            };


        reader.onerror =
            function () {

                reject(
                    reader.error
                );

            };


        reader.readAsDataURL(file);

    });

}


/* -------------------------- */
/* Complete Beta Order */
/* -------------------------- */

async function completeBetaOrder() {
    if (!sessionId) {
        throw new Error(
            "No Stripe session ID found."
        );
    }

    const selection =
        await getSelection();

    const selectedPack =
        parseInt(
            sessionStorage.getItem("tpc_pack") || "12",
            10
        );

    const TARGET_COUNT =
        selectedPack === 36 ? 36 : 12;

    if (
        !selection ||
        !selection.photos ||
        selection.photos.length !== TARGET_COUNT
    ) {
        throw new Error(
            "Your selected photos could not be found."
        );
    }

    const quantities = {};

    for (
        const photoId
        of selection.photos
    ) {
        if (!quantities[photoId]) {
            quantities[photoId] = 0;
        }

        quantities[photoId]++;
    }

    const photoIds =
        Object.keys(quantities);

   const uploadPhoto =
    async function (photoId, index) {

        const storedPhoto =
            await getPhoto(photoId);

        if (!storedPhoto) {
            throw new Error(
                "A selected photo could not be found."
            );
        }

        const data =
            await fileToDataURL(
                storedPhoto.blob
            );

        console.log(
            `Sending beta photo ${index + 1} of ${photoIds.length}:`,
            photoId
        );

        const response =
            await fetch(
                "/api/complete-beta-photo-order",
                {
                    method:
                        "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            sessionId:
                                sessionId,
                            photo: {
                                id:
                                    photoId,
                                data:
                                    data,
                                quantity:
                                    quantities[photoId]
                            }
                        })
                }
            );

        const dataResponse =
            await response.json();

        if (!response.ok) {
            throw new Error(
                dataResponse.error ||
                "Unable to save photo."
            );
        }

    };


let nextIndex = 0;

const workers =
    Array.from(
        {
            length:
                Math.min(
                    4,
                    photoIds.length
                )
        },
        async function () {

            while (
                nextIndex <
                photoIds.length
            ) {

                const index =
                    nextIndex++;

                await uploadPhoto(
                    photoIds[index],
                    index
                );

            }

        }
    );

await Promise.all(
    workers
);

    return {
        success:
            true
    };
}


/* -------------------------- */
/* Run */
/* -------------------------- */

async function verifyPayment() {

    try {

        await completeBetaOrder();

        console.log(
            "Tiny Photo Club beta order successfully saved."
        );

    }

    catch (error) {

        console.error(
            "Beta photo order failed:",
            error
        );

        alert(
            "There was a problem saving your photos: " +
            error.message
        );

    }

}


verifyPayment();