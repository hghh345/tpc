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
    2;

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
/* Complete Photo Order */
/* -------------------------- */

async function completePhotoOrder(
    photoSessionId
) {

    const selection =
        await getSelection();


    if (
        !selection ||
        !selection.photos ||
        selection.photos.length !== 12
    ) {

        throw new Error(
            "Your 12 selected photos could not be found."
        );

    }


    /*
       Count how many physical prints
       each photo represents.
    */

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


    /*
       Convert each UNIQUE photo into
       base64 data.
    */

    const photos = [];


    for (
        const photoId
        of Object.keys(quantities)
    ) {

        const storedPhoto =
            await getPhoto(photoId);


        if (!storedPhoto) {

            throw new Error(
                "A selected photo could not be found."
            );

        }


        const data =
            await fileToDataURL(
                storedPhoto.file
            );


        photos.push({

            id:
                photoId,

            data:
                data,

            quantity:
                quantities[photoId]

        });

    }


    console.log(
        "Sending photos:",
        photos
    );


    /*
       Send the photos to our secure
       server endpoint.
    */

    const response =
        await fetch(
            "/api/complete-photo-order",
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

                        photoSessionId:
                            photoSessionId,

                        photos:
                            photos

                    })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error ||
            "Unable to save your photos."
        );

    }


    console.log(
        "Photo order complete:",
        data
    );


    return data;

}


/* -------------------------- */
/* Verify Payment */
/* -------------------------- */

async function verifyPayment() {

    if (!sessionId) {

        console.error(
            "No Stripe session ID found."
        );

        return;

    }


    try {

        /*
           First ask Stripe whether payment
           was actually completed.
        */

        const response =
            await fetch(
                "/api/get-checkout-session",
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
                                sessionId

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to verify payment"
            );

        }


        console.log(
            "Payment verified:",
            data
        );


        /*
           Now transfer the photos.
        */

        const result =
            await completePhotoOrder(
                data.photoSessionId
            );


        console.log(
            "Everything is complete:",
            result
        );


        /*
           Clean up temporary browser storage.
        */

        console.log(
            "Photo order successfully saved."
        );

    }


    catch (error) {

        console.error(
            "Photo order failed:",
            error
        );

    }

}


verifyPayment();