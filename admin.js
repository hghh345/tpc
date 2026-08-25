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


let adminPassword = "";


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


/* -------------------------- */
/* LOAD ORDERS */
/* -------------------------- */

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


        /*
           Keep the password in memory
           so the buttons can use it.
        */

        adminPassword =
            password;


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


/* -------------------------- */
/* RENDER ORDERS */
/* -------------------------- */

function renderOrders(
    orders
) {

    orderList.innerHTML =
        "";


    if (!orders.length) {

        orderList.innerHTML =
            "<p>no orders yet ♡</p>";

        return;

    }


    orders.forEach(
        renderOrder
    );

}


/* -------------------------- */
/* RENDER ONE ORDER */
/* -------------------------- */

function renderOrder(
    order
) {

    const article =
        document.createElement("article");


    article.className =
        "admin-order";


    /* -------------------------- */
    /* Customer */
    /* -------------------------- */

    const heading =
        document.createElement("h3");


    heading.textContent =
        order.email;


    /* -------------------------- */
    /* Details */
    /* -------------------------- */

    const details =
        document.createElement("p");


    details.textContent =
        `${order.plan} · cycle #${order.cycleNumber}`;


    /* -------------------------- */
    /* Status */
    /* -------------------------- */

    const status =
        document.createElement("p");


    status.textContent =
        `status: ${order.status}`;


    status.className =
        "admin-status";


    /* -------------------------- */
    /* Photos */
    /* -------------------------- */

    const photoGrid =
        document.createElement("div");


    photoGrid.className =
        "admin-photo-grid";


    /*
       Create one physical slot
       for every print.

       Quantity 2 means the same
       image appears twice.
    */

    order.photos.forEach(
        photo => {

            for (
                let i = 0;
                i < photo.quantity;
                i++
            ) {

                const wrapper =
                    document.createElement("div");


                wrapper.className =
                    "admin-photo";


                const image =
                    document.createElement("img");


                image.src =
                    photo.url;


                image.alt =
                    "customer print";


                wrapper.appendChild(
                    image
                );


                photoGrid.appendChild(
                    wrapper
                );

            }

        }
    );


    /* -------------------------- */
    /* Actions */
    /* -------------------------- */

    const actions =
        document.createElement("div");


    actions.className =
        "admin-actions";


    /*
       READY
    */

    if (
        order.status ===
        "ready"
    ) {

        const generateButton =
            document.createElement("button");


        generateButton.type =
            "button";


        generateButton.textContent =
            "generate print sheet →";


        generateButton.addEventListener(
            "click",
            function () {

                generatePrintSheet(
                    order.printCycleId
                );

            }
        );


        actions.appendChild(
            generateButton
        );


        const printedButton =
            document.createElement("button");


        printedButton.type =
            "button";


        printedButton.textContent =
            "mark printed";


        printedButton.addEventListener(
            "click",
            function () {

                updateStatus(
                    order.printCycleId,
                    "printed"
                );

            }
        );


        actions.appendChild(
            printedButton
        );

    }


    /*
       PRINTED
    */

    if (
        order.status ===
        "printed"
    ) {

        const fulfilledButton =
            document.createElement("button");


        fulfilledButton.type =
            "button";


        fulfilledButton.textContent =
            "mark fulfilled";


        fulfilledButton.addEventListener(
            "click",
            function () {

                updateStatus(
                    order.printCycleId,
                    "fulfilled"
                );

            }
        );


        actions.appendChild(
            fulfilledButton
        );

    }


    /* -------------------------- */
    /* Add everything */
    /* -------------------------- */

    article.appendChild(
        heading
    );

    article.appendChild(
        details
    );

    article.appendChild(
        status
    );

    article.appendChild(
        photoGrid
    );

    article.appendChild(
        actions
    );


    orderList.appendChild(
        article
    );

}


/* -------------------------- */
/* GENERATE PRINT SHEET */
/* -------------------------- */

async function generatePrintSheet(
    printCycleId
) {

    try {

        const response =
            await fetch(
                "/api/generate-print-sheet",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            password:
                                adminPassword,

                            printCycleId:
                                printCycleId

                        })

                }
            );


        if (!response.ok) {

            let message =
                "Unable to generate print sheet";


            try {

                const data =
                    await response.json();

                message =
                    data.error ||
                    message;

            }

            catch (error) {}

            
            throw new Error(
                message
            );

        }


        const blob =
            await response.blob();


        const url =
            URL.createObjectURL(
                blob
            );


        window.open(
            url,
            "_blank"
        );

    }


    catch (error) {

        console.error(
            error
        );

        alert(
            error.message
        );

    }

}


/* -------------------------- */
/* UPDATE STATUS */
/* -------------------------- */

async function updateStatus(
    printCycleId,
    newStatus
) {

    const message =
        newStatus === "printed"
            ? "mark this order as printed?"
            : "mark this order as fulfilled?";


    if (
        !confirm(message)
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                "/api/update-print-cycle",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            password:
                                adminPassword,

                            printCycleId:
                                printCycleId,

                            status:
                                newStatus

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to update order"
            );

        }


        /*
           Reload the orders so
           the buttons update.
        */

        await reloadOrders();

    }


    catch (error) {

        console.error(
            error
        );

        alert(
            error.message
        );

    }

}


/* -------------------------- */
/* RELOAD ORDERS */
/* -------------------------- */

async function reloadOrders() {

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
                            adminPassword

                    })

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.error ||
            "Unable to reload orders"
        );

    }


    renderOrders(
        data.orders
    );

}