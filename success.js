/* -------------------------------- */
/* TINY PHOTO CLUB */
/* success.js */
/* -------------------------------- */

const params =
    new URLSearchParams(
        window.location.search
    );


const sessionId =
    params.get("session_id");


if (!sessionId) {

    console.error(
        "No Stripe session ID found."
    );

}
else {

    verifyPayment();

}


async function verifyPayment() {

    try {

        const response =
            await fetch(
                "/api/get-checkout-session",
                {

                    method: "POST",

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


        console.log(
            "Photo session:",
            data.photoSessionId
        );


    }

    catch (error) {

        console.error(
            "Payment verification failed:",
            error
        );

    }

}