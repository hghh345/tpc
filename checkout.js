const pack =
    parseInt(
        sessionStorage.getItem("tpc_pack") || "12",
        10
    );

const emailInput =
    document.getElementById("email");

const checkoutButton =
    document.getElementById("checkout-button");


/* -------------------------- */
/* Stripe Prices */
/* -------------------------- */

const PRICE_12 =
    "price_1UHqVsA5iFvf2pvFl4gaGU94";

const PRICE_36 =
    "price_1UHqWOA5iFvf2pvFnO3hENH8";


const priceId =
    pack === 36
        ? PRICE_36
        : PRICE_12;


/* -------------------------- */
/* Restore Email */
/* -------------------------- */

const savedEmail =
    sessionStorage.getItem("tpc_email");


if (savedEmail) {

    emailInput.value =
        savedEmail;

}


/* -------------------------- */
/* Checkout */
/* -------------------------- */

checkoutButton.addEventListener(
    "click",
    async function () {

        const email =
            emailInput.value.trim();


        if (!email) {

            emailInput.focus();

            return;

        }


        if (
            !emailInput.checkValidity()
        ) {

            emailInput.reportValidity();

            return;

        }


        const delivery =
            document.querySelector(
                'input[name="delivery"]:checked'
            ).value;


        /*
           Save the final email and
           delivery choice.
        */

        sessionStorage.setItem(
            "tpc_email",
            email
        );

        sessionStorage.setItem(
            "tpc_delivery",
            delivery
        );


        /*
           The existing upload flow creates
           and stores the photo session ID.
        */

        const photoSessionId =
            sessionStorage.getItem(
                "photoSessionId"
            );


        if (!photoSessionId) {

            alert(
                "We couldn't find your photo session. Please go back and try again."
            );

            return;

        }


        /*
           Prevent double-clicks.
        */

        checkoutButton.disabled =
            true;

        checkoutButton.textContent =
            "one second...";


        try {

            const response =
                await fetch(
                    "/api/create-beta-checkout-session",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({

                                priceId:
                                    priceId,

                                email:
                                    email,

                                photoSessionId:
                                    photoSessionId,

                                packSize:
                                    pack,

                                delivery:
                                    delivery

                            })

                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to start checkout."
                );

            }


            /*
               Send customer to Stripe.
            */

            window.location.href =
                data.url;

        }


        catch (error) {

            console.error(
                "Checkout error:",
                error
            );


            alert(
                "Something went wrong starting checkout. Please try again."
            );


            checkoutButton.disabled =
                false;

            checkoutButton.textContent =
                "pay →";

        }

    }
);