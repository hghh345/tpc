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

const betaOrderList =
    document.querySelector("#beta-order-list");

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


        await loadBetaOrders();

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
/* LOAD BETA ORDERS */
/* -------------------------- */

async function loadBetaOrders() {

    try {

        const response =
            await fetch(
                "/api/admin-beta-orders",
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
console.log("BETA API STATUS:", response.status);

        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load beta orders"
            );

        }


        renderBetaOrders(
            data.orders
        );

    }


    catch (error) {

        console.error(
            "Beta orders error:",
            error
        );

        betaOrderList.innerHTML =
            "<p>unable to load summer experiment orders ♡</p>";

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
/* RENDER BETA ORDERS */
/* -------------------------- */
function renderBetaOrders(
    orders
) {

    betaOrderList.innerHTML =
        "";


    if (!orders.length) {

        betaOrderList.innerHTML =
            "<p>no summer experiment orders yet ♡</p>";

        return;

    }


    /* -------------------------- */
    /* BATCH CONTROLS */
    /* -------------------------- */

    const batchControls =
        document.createElement("div");


    batchControls.className =
        "beta-batch-controls";


    const selectAllButton =
        document.createElement("button");


    selectAllButton.type =
        "button";


    selectAllButton.textContent =
        "select all";


    selectAllButton.addEventListener(
        "click",
        function () {

            const checkboxes =
                betaOrderList.querySelectorAll(
                    ".beta-order-checkbox"
                );


            checkboxes.forEach(
                checkbox => {
                    checkbox.checked =
                        true;
                }
            );

        }
    );


    const generateBatchButton =
        document.createElement("button");


    generateBatchButton.type =
        "button";


    generateBatchButton.textContent =
        "generate selected →";


    generateBatchButton.addEventListener(
        "click",
        generateBetaPrintBatch
    );


    batchControls.appendChild(
        selectAllButton
    );

    batchControls.appendChild(
        generateBatchButton
    );


    betaOrderList.appendChild(
        batchControls
    );


    /* -------------------------- */
    /* ORDERS */
    /* -------------------------- */

    orders.forEach(
        renderBetaOrder
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
/* RENDER ONE BETA ORDER */
/* -------------------------- */

function renderBetaOrder(
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


const checkbox =
    document.createElement("input");


checkbox.type =
    "checkbox";


checkbox.className =
    "beta-order-checkbox";


checkbox.dataset.orderId =
    order.betaOrderId;


heading.appendChild(
    checkbox
);


const email =
    document.createElement("span");


email.textContent =
    order.email;


heading.appendChild(
    email
);


    /* -------------------------- */
    /* Details */
/* -------------------------- */

    const details =
        document.createElement("p");


    const deliveryLabels = {

        gallery:
            "gallery pickup",

        nosmallphotos:
            "No Small Photos",

        mail:
            "mail"

    };


    details.textContent =
        `${order.packSize} photos · ${deliveryLabels[order.delivery] || order.delivery}`;


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
    /* ACTIONS */
/* -------------------------- */

    const actions =
        document.createElement("div");


    actions.className =
        "admin-actions";


    /* READY */

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

                generateBetaPrintSheet(
                    order.betaOrderId
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

                updateBetaStatus(
                    order.betaOrderId,
                    "printed"
                );

            }
        );


        actions.appendChild(
            printedButton
        );

    }


    /* PRINTED */

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

                updateBetaStatus(
                    order.betaOrderId,
                    "fulfilled"
                );

            }
        );


        actions.appendChild(
            fulfilledButton
        );

    }


    /* -------------------------- */
    /* ADD EVERYTHING */
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


    betaOrderList.appendChild(
        article
    );

}


/* -------------------------- */
/* GENERATE SUBSCRIPTION PRINT SHEET */
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
/* GENERATE BETA PRINT SHEET */
/* -------------------------- */

async function generateBetaPrintSheet(
    betaOrderId
) {

    try {

        const response =
            await fetch(
                "/api/generate-beta-print-sheet",
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

                            betaOrderId:
                                betaOrderId

                        })

                }
            );


      if (!response.ok) {

    const raw =
        await response.text();

    console.log(
        "BETA PRINT ERROR RESPONSE:",
        raw
    );

    throw new Error(
        raw ||
        "Unable to generate print sheet"
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
/* UPDATE SUBSCRIPTION STATUS */
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
/* UPDATE BETA STATUS */
/* -------------------------- */

async function updateBetaStatus(
    betaOrderId,
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
                "/api/update-beta-order",
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

                            betaOrderId:
                                betaOrderId,

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
                "Unable to update beta order"
            );

        }


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


    await loadBetaOrders();

}
/* -------------------------- */
/* GENERATE BETA PRINT BATCH */
/* -------------------------- */

async function generateBetaPrintBatch() {

    const checkboxes =
        betaOrderList.querySelectorAll(
            ".beta-order-checkbox:checked"
        );


    const betaOrderIds =
        Array.from(
            checkboxes
        ).map(
            checkbox =>
                checkbox.dataset.orderId
        );


    if (
        betaOrderIds.length === 0
    ) {

        alert(
            "select at least one order ♡"
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/generate-beta-print-batch",
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

                            betaOrderIds:
                                betaOrderIds

                        })

                }
            );


        if (!response.ok) {

            const raw =
                await response.text();


            throw new Error(
                raw ||
                "Unable to generate print batch"
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