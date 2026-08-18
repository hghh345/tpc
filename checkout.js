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

checkoutButton.addEventListener("click", () => {

    const email = emailInput.value.trim();

    /*
       Make sure an email was entered
    */

    if (!email) {

        emailInput.focus();

        emailInput.setCustomValidity(
            "please enter your email ♡"
        );

        emailInput.reportValidity();

        return;

    }


    /*
       Make sure the email looks valid
    */

    if (!emailInput.checkValidity()) {

        emailInput.focus();

        emailInput.reportValidity();

        return;

    }


    /*
       For now, just confirm everything is ready.
       We'll replace this with Stripe Checkout next.
    */

    const selectedPlan =
        document.querySelector(".plan.selected");

    const selectedPrice =
        selectedPlan.dataset.price;

    console.log("email:", email);
    console.log("plan:", selectedPlan.querySelector("h2").textContent);
    console.log("price:", selectedPrice);

    alert("Next we'll connect Stripe Checkout.");

});