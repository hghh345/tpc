const passwordInput =
    document.querySelector("#admin-password");

const loginButton =
    document.querySelector("#login-button");

const loginSection =
    document.querySelector("#login");

const ordersSection =
    document.querySelector("#orders");

const orderList =
    document.querySelector("#order-list");

const loginError =
    document.querySelector("#login-error");


loginButton.addEventListener(
    "click",
    loadOrders
);


passwordInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            loadOrders();

        }

    }
);


async function loadOrders() {

    const password =
        passwordInput.value.trim();


    if (!password) {

        loginError.textContent =
            "enter your password ♡";

        return;

    }


    loginButton.disabled =
        true;

    loginButton.textContent =
        "loading...";


    loginError.textContent =
        "";


    try {

        const response =
            await fetch(
                "/api/admin-orders",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            password:
                                password
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load orders"
            );

        }


        loginSection.style.display =
            "none";

        ordersSection.style.display =
            "block";


        renderOrders(
            data.orders
        );

    }


    catch (error) {

        console.error(error);

        loginError.textContent =
            "wrong password or something went wrong ♡";

        loginButton.disabled =
            false;

        loginButton.textContent =
            "enter →";

    }

}


function renderOrders(orders) {

    orderList.innerHTML = "";


    if (!orders.length) {

        orderList.innerHTML =
            "<p>no orders yet ♡</p>";

        return;

    }


    orders.forEach(
        renderOrder
    );

}


function renderOrder(order) {

    const article =
        document.createElement("article");


    article.className =
        "admin-order";


    const heading =
        document.createElement("h3");


    heading.textContent =
        order.email;


    const details =
        document.createElement("p");


    details.textContent =
        `${order.plan} · cycle #${order.cycleNumber} · ${order.status}`;


    const photoGrid =
        document.createElement("div");


    photoGrid.className =
        "admin-photo-grid";


    order.photos.forEach(
        photo => {

            const wrapper =
                document.createElement("div");


            wrapper.className =
                "admin-photo";


            const image =
                document.createElement("img");


            image.src =
                photo.url;


            image.alt =
                "customer photo";


            wrapper.appendChild(
                image
            );


            if (
                photo.quantity > 1
            ) {

                const quantity =
                    document.createElement("div");


                quantity.className =
                    "photo-quantity";


                quantity.textContent =
                    `×${photo.quantity}`;


                wrapper.appendChild(
                    quantity
                );

            }


            photoGrid.appendChild(
                wrapper
            );

        }
    );


    article.appendChild(
        heading
    );

    article.appendChild(
        details
    );

    article.appendChild(
        photoGrid
    );


    orderList.appendChild(
        article
    );

}