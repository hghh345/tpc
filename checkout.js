const plans = document.querySelectorAll(".plan");
const price = document.querySelector("#price");

plans.forEach(plan => {

    plan.addEventListener("click", () => {

        plans.forEach(p => p.classList.remove("selected"));

        plan.classList.add("selected");

        price.textContent =
        "€" + plan.dataset.price;

    });

});

document
.querySelector("#checkout-button")
.addEventListener("click", () => {

    alert("Next we'll connect Stripe Checkout.");

});