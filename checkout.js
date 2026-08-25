async function preparePhotoSession() {

    const photoSessionId =
        crypto.randomUUID();

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                "tiny-photo-club",
                2
            );

        request.onsuccess =
            function () {

                const db =
                    request.result;

                const transaction =
                    db.transaction(
                        "selection",
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        "selection"
                    );

                const getRequest =
                    store.get("current");

                getRequest.onsuccess =
                    function () {

                        const selection =
                            getRequest.result;

                        if (
                            !selection ||
                            !selection.photos ||
                            selection.photos.length !== 12
                        ) {

                            reject(
                                new Error(
                                    "Your dozen could not be found."
                                )
                            );

                            return;

                        }

                        selection.status =
                            "checkout";

                        selection.photoSessionId =
                            photoSessionId;

                        store.put(selection);

                    };

                getRequest.onerror =
                    function () {

                        reject(
                            getRequest.error
                        );

                    };

                transaction.oncomplete =
                    function () {

                        resolve(
                            photoSessionId
                        );

                    };

                transaction.onerror =
                    function () {

                        reject(
                            transaction.error
                        );

                    };

            };

        request.onerror =
            function () {

                reject(
                    request.error
                );

            };

    });

}

const plans = document.querySelectorAll(".plan");
const price = document.querySelector("#price");
const emailInput = document.querySelector("#email");
const checkoutButton = document.querySelector("#checkout-button");


/* -------------------------- */
/* PLAN SELECTION */
/* -------------------------- */

plans.forEach(plan => {

    plan.addEventListener("click", () => {

        plans.forEach(p => p.classList.remove("selected"));

        plan.classList.add("selected");

        price.textContent =
            "€" + plan.dataset.price;

    });

});


/* -------------------------- */
/* CHECKOUT */
/* -------------------------- */

checkoutButton.addEventListener("click", async () => {

    const email = emailInput.value.trim();

    /*
       Check email
    */

    if (!email) {

        emailInput.focus();
        emailInput.reportValidity();

        return;

    }

    if (!emailInput.checkValidity()) {

        emailInput.focus();
        emailInput.reportValidity();

        return;

    }


    /*
       Find selected plan
    */

    const selectedPlan =
        document.querySelector(".plan.selected");

    const selectedPrice =
        selectedPlan.dataset.price;

        const photoSessionId =
    await preparePhotoSession();


    /*
       Match selected plan to Stripe Price ID
    */

    let priceId;

    if (selectedPrice === "18") {

        priceId =
            "price_1U82TOA5iFvf2pvF4uGCTXSS";

    }

    else if (selectedPrice === "45") {

        priceId =
            "price_1U82U6A5iFvf2pvFr1MFGx4U";

    }


    /*
       Disable button while Stripe session
       is being created
    */

    checkoutButton.disabled = true;

    checkoutButton.textContent =
        "one moment ♡";


    try {

        const response = await fetch(
            "/api/create-checkout-session",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    priceId: priceId,
                    email: email
                        photoSessionId: photoSessionId
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Something went wrong."
            );

        }


        /*
           Send customer to Stripe
        */

        window.location.href = data.url;

    }

    catch (error) {

        console.error(error);

        alert(
            "something went wrong ♡ please try again."
        );

        checkoutButton.disabled = false;

        checkoutButton.textContent =
            "continue to checkout →";

    }

});