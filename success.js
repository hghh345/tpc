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

    console.log(
        "Stripe session:",
        sessionId
    );

}