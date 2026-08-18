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


    /*
       Match selected plan to Stripe Price ID
    */

    let priceId;

    if (selectedPrice === "18") {

        priceId =
            "price_1U5umPA5iFvf2pvF3lnKlghA";

    }

    else if (selectedPrice === "45") {

        priceId =
            "price_1U5un7A5iFvf2pvFsiwTmiSF";

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