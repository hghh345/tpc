const betaPack =
    parseInt(
        sessionStorage.getItem("tpc_pack") || "12",
        10
    );


const betaEmailInput =
    document.getElementById("email");


const betaCheckoutButton =
    document.getElementById("checkout-button");


/* -------------------------- */
/* Stripe Prices */
/* -------------------------- */

const BETA_PRICE_12 =
    "price_1UHqVsA5iFvf2pvFl4gaGU94";


const BETA_PRICE_36 =
    "price_1UHqWOA5iFvf2pvFnO3hENH8";


const betaPriceId =
    betaPack === 36
        ? BETA_PRICE_36
        : BETA_PRICE_12;


/* -------------------------- */
/* Restore Email */
/* -------------------------- */

const betaSavedEmail =
    sessionStorage.getItem("tpc_email");


if (betaSavedEmail) {

    betaEmailInput.value =
        betaSavedEmail;

}


/* -------------------------- */
/* Checkout */
/* -------------------------- */

betaCheckoutButton.addEventListener(
    "click",
    async function () {

        const betaEmail =
            betaEmailInput.value.trim();


        if (!betaEmail) {

            betaEmailInput.focus();

            return;

        }


        if (
            !betaEmailInput.checkValidity()
        ) {

            betaEmailInput.reportValidity();

            return;

        }


        const betaDelivery =
            document.querySelector(
                'input[name="delivery"]:checked'
            ).value;


        /* Save order details */

        sessionStorage.setItem(
            "tpc_email",
            betaEmail
        );


        sessionStorage.setItem(
            "tpc_delivery",
            betaDelivery
        );


        /* Prevent double-clicks */

        betaCheckoutButton.disabled =
            true;

        betaCheckoutButton.textContent =
            "one second...";


        try {

            const betaResponse =
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
                                    betaPriceId,

                                email:
                                    betaEmail,

                                packSize:
                                    betaPack,

                                delivery:
                                    betaDelivery

                            })

                    }
                );


            const betaData =
                await betaResponse.json();


            if (!betaResponse.ok) {

                throw new Error(
                    betaData.error ||
                    "Unable to start checkout."
                );

            }


            /* Send customer to Stripe */

            window.location.href =
                betaData.url;

        }


        catch (error) {

            console.error(
                "Beta checkout error:",
                error
            );


            alert(
                "Something went wrong starting checkout. Please try again."
            );


            betaCheckoutButton.disabled =
                false;

            betaCheckoutButton.textContent =
                "pay →";

        }

    }
);