const {
    createClient
} = require("@supabase/supabase-js");

const {
    PDFDocument,
    rgb
} = require("pdf-lib");

const sharp =
    require("sharp");


const supabase =
    createClient(
        "https://cvuyybeihtvhygxukbuj.supabase.co/",
        process.env.SUPABASE_SECRET_KEY
    );


/* -------------------------- */
/* PRINT DIMENSIONS */
/* -------------------------- */

const A4_WIDTH =
    297 / 25.4 * 72;

const A4_HEIGHT =
    210 / 25.4 * 72;

const PRINT_SIZE =
    100 / 25.4 * 72;

const PHOTO_SIZE =
    80 / 25.4 * 72;

const COLUMNS =
    3;

const ROWS =
    2;

const GRID_WIDTH =
    PRINT_SIZE * COLUMNS;

const GRID_HEIGHT =
    PRINT_SIZE * ROWS;

const LEFT_MARGIN =
    (A4_WIDTH - GRID_WIDTH) / 2;

const BOTTOM_MARGIN =
    (A4_HEIGHT - GRID_HEIGHT) / 2;

const CUT_MARK_LENGTH =
    8;


/* -------------------------- */
/* DOWNLOAD PHOTO */
/* -------------------------- */

async function downloadPhoto(
    storagePath
) {

    const {
        data,
        error
    } =
        await supabase
            .storage
            .from("customer-photos")
            .download(
                storagePath
            );

    if (error) {
        throw error;
    }

    const arrayBuffer =
        await data.arrayBuffer();

    return Buffer.from(
        arrayBuffer
    );

}


/* -------------------------- */
/* SQUARE CROP */
/* -------------------------- */

async function makeSquarePhoto(
    imageBuffer
) {

    const metadata =
        await sharp(
            imageBuffer
        ).metadata();

    const width =
        metadata.width;

    const height =
        metadata.height;

    if (
        !width ||
        !height
    ) {

        throw new Error(
            "Unable to read image dimensions"
        );

    }

    const squareSize =
        Math.min(
            width,
            height
        );

    const left =
        Math.floor(
            (width - squareSize) / 2
        );

    const top =
        Math.floor(
            (height - squareSize) / 2
        );

    return await sharp(
        imageBuffer
    )
        .extract({
            left,
            top,
            width:
                squareSize,
            height:
                squareSize
        })
        .jpeg({
            quality:
                95
        })
        .toBuffer();

}


/* -------------------------- */
/* CUT MARKS */
/* -------------------------- */
function drawCutMarks(
    page,
    x,
    y
) {

    const thickness = 0.5;
    const centerMarkLength = 6;

    /* bottom-left */

    page.drawLine({
        start: {
            x: x - CUT_MARK_LENGTH,
            y
        },
        end: {
            x: x - 2,
            y
        },
        thickness,
        color: rgb(0, 0, 0)
    });

    page.drawLine({
        start: {
            x,
            y: y - CUT_MARK_LENGTH
        },
        end: {
            x,
            y: y - 2
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* bottom-right */

    page.drawLine({
        start: {
            x: x + PRINT_SIZE + 2,
            y
        },
        end: {
            x: x + PRINT_SIZE + CUT_MARK_LENGTH,
            y
        },
        thickness,
        color: rgb(0, 0, 0)
    });

    page.drawLine({
        start: {
            x: x + PRINT_SIZE,
            y: y - CUT_MARK_LENGTH
        },
        end: {
            x: x + PRINT_SIZE,
            y: y - 2
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* top-left */

    page.drawLine({
        start: {
            x: x - CUT_MARK_LENGTH,
            y: y + PRINT_SIZE
        },
        end: {
            x: x - 2,
            y: y + PRINT_SIZE
        },
        thickness,
        color: rgb(0, 0, 0)
    });

    page.drawLine({
        start: {
            x,
            y: y + PRINT_SIZE + 2
        },
        end: {
            x,
            y: y + PRINT_SIZE + CUT_MARK_LENGTH
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* top-right */

    page.drawLine({
        start: {
            x: x + PRINT_SIZE + 2,
            y: y + PRINT_SIZE
        },
        end: {
            x: x + PRINT_SIZE + CUT_MARK_LENGTH,
            y: y + PRINT_SIZE
        },
        thickness,
        color: rgb(0, 0, 0)
    });

    page.drawLine({
        start: {
            x: x + PRINT_SIZE,
            y: y + PRINT_SIZE + 2
        },
        end: {
            x: x + PRINT_SIZE,
            y: y + PRINT_SIZE + CUT_MARK_LENGTH
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* bottom-center */

    page.drawLine({
        start: {
            x: x + PRINT_SIZE / 2,
            y: y - centerMarkLength
        },
        end: {
            x: x + PRINT_SIZE / 2,
            y: y - 2
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* top-center */

    page.drawLine({
        start: {
            x: x + PRINT_SIZE / 2,
            y: y + PRINT_SIZE + 2
        },
        end: {
            x: x + PRINT_SIZE / 2,
            y: y + PRINT_SIZE + centerMarkLength
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* left-center */

    page.drawLine({
        start: {
            x: x - centerMarkLength,
            y: y + PRINT_SIZE / 2
        },
        end: {
            x: x - 2,
            y: y + PRINT_SIZE / 2
        },
        thickness,
        color: rgb(0, 0, 0)
    });


    /* right-center */

    page.drawLine({
        start: {
            x: x + PRINT_SIZE + 2,
            y: y + PRINT_SIZE / 2
        },
        end: {
            x: x + PRINT_SIZE + centerMarkLength,
            y: y + PRINT_SIZE / 2
        },
        thickness,
        color: rgb(0, 0, 0)
    });

}

/* -------------------------- */
/* GET PRINT SLOTS */
/* -------------------------- */

async function getPrintSlots(
    betaOrder
) {

    const packSize =
        Number(
            betaOrder.pack_size
        );


    if (
        ![
            12,
            36
        ].includes(
            packSize
        )
    ) {

        throw new Error(
            "Invalid beta pack size"
        );

    }


    /* -------------------------- */
    /* SELECTED PHOTOS */
    /* -------------------------- */

    const {
        data: selectedRows,
        error: selectedError
    } =
        await supabase
            .from(
                "beta_selected_photos"
            )
            .select(
                "beta_photo_id, quantity, created_at"
            )
            .eq(
                "beta_order_id",
                betaOrder.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        true
                }
            );


    if (
        selectedError
    ) {

        throw selectedError;

    }


    /* -------------------------- */
    /* GET BETA PHOTO RECORDS */
    /* -------------------------- */

    const betaPhotoIds =
        [
            ...new Set(
                selectedRows.map(
                    row =>
                        row.beta_photo_id
                )
            )
        ];


    if (
        betaPhotoIds.length === 0
    ) {

        throw new Error(
            "No photos found for this order"
        );

    }


    const {
        data: betaPhotos,
        error: betaPhotosError
    } =
        await supabase
            .from(
                "beta_photos"
            )
            .select(
                "id, photo_id, storage_path"
            )
            .in(
                "id",
                betaPhotoIds
            );


    if (
        betaPhotosError
    ) {

        throw betaPhotosError;

    }


    const photoMap =
        new Map();


    for (
        const photo
        of betaPhotos
    ) {

        photoMap.set(
            photo.id,
            photo
        );

    }


    /* -------------------------- */
    /* CREATE PRINT SLOTS */
    /* -------------------------- */

    const printSlots =
        [];


    for (
        const selected
        of selectedRows
    ) {

        const photo =
            photoMap.get(
                selected.beta_photo_id
            );


        if (
            !photo ||
            !photo.storage_path
        ) {

            continue;

        }


        const quantity =
            Number(
                selected.quantity
            );


        for (
            let i = 0;
            i < quantity;
            i++
        ) {

            printSlots.push({

                photoId:
                    photo.photo_id,

                storagePath:
                    photo.storage_path

            });

        }

    }


    if (
        printSlots.length !==
        packSize
    ) {

        throw new Error(
            `Expected ${packSize} prints but found ${printSlots.length}`
        );

    }


    return printSlots;

}


/* -------------------------- */
/* ADD ORDER TO PDF */
/* -------------------------- */

async function addOrderToPdf(
    pdfDoc,
    betaOrder
) {

    const printSlots =
        await getPrintSlots(
            betaOrder
        );


    const pageCount =
        Math.ceil(
            printSlots.length / 6
        );


    for (
        let pageIndex = 0;
        pageIndex < pageCount;
        pageIndex++
    ) {

        const page =
            pdfDoc.addPage([
                A4_WIDTH,
                A4_HEIGHT
            ]);


        const pageSlots =
            printSlots.slice(
                pageIndex * 6,
                pageIndex * 6 + 6
            );


        for (
            let slotIndex = 0;
            slotIndex <
            pageSlots.length;
            slotIndex++
        ) {

            const slot =
                pageSlots[
                    slotIndex
                ];


            /* DOWNLOAD */

            const originalBuffer =
                await downloadPhoto(
                    slot.storagePath
                );


            /* CROP */

            const squareBuffer =
                await makeSquarePhoto(
                    originalBuffer
                );


            /* EMBED */

            const image =
                await pdfDoc.embedJpg(
                    squareBuffer
                );


            /* POSITION */

            const column =
                slotIndex %
                COLUMNS;

            const row =
                Math.floor(
                    slotIndex /
                    COLUMNS
                );


            const x =
                LEFT_MARGIN +
                column *
                PRINT_SIZE;


            const y =
                BOTTOM_MARGIN +
                (
                    ROWS -
                    1 -
                    row
                ) *
                PRINT_SIZE;


            /* WHITE PRINT */

            page.drawRectangle({

                x,
                y,

                width:
                    PRINT_SIZE,

                height:
                    PRINT_SIZE,

                color:
                    rgb(1, 1, 1)

            });


            /* PHOTO */

            page.drawImage(
                image,
                {

                    x:
                        x +
                        (
                            PRINT_SIZE -
                            PHOTO_SIZE
                        ) / 2,

                    y:
                        y +
                        (
                            PRINT_SIZE -
                            PHOTO_SIZE
                        ) / 2,

                    width:
                        PHOTO_SIZE,

                    height:
                        PHOTO_SIZE

                }
            );


            /* CUT MARKS */

            drawCutMarks(
                page,
                x,
                y
            );

        }

    }

}


/* -------------------------- */
/* API */
/* -------------------------- */

module.exports =
    async function (
        req,
        res
    ) {

        if (
            req.method !== "POST"
        ) {

            return res.status(405).json({
                error:
                    "Method not allowed"
            });

        }


        try {

            const {
                password,
                betaOrderId,
                betaOrderIds
            } =
                req.body;


            /* -------------------------- */
            /* PASSWORD */
            /* -------------------------- */

            if (
                !password ||
                password !==
                    process.env.ADMIN_PASSWORD
            ) {

                return res.status(401).json({
                    error:
                        "Unauthorized"
                });

            }


            /* -------------------------- */
            /* DETERMINE ORDERS */
            /* -------------------------- */

            let orderIds = [];


            if (
                Array.isArray(
                    betaOrderIds
                ) &&
                betaOrderIds.length > 0
            ) {

                orderIds =
                    betaOrderIds;

            }

            else if (
                betaOrderId
            ) {

                orderIds = [
                    betaOrderId
                ];

            }

            else {

                return res.status(400).json({
                    error:
                        "Missing beta order ID"
                });

            }


            /* -------------------------- */
            /* GET ORDERS */
            /* -------------------------- */

            const {
                data: betaOrders,
                error: betaOrdersError
            } =
                await supabase
                    .from("beta_orders")
                    .select("*")
                    .in(
                        "id",
                        orderIds
                    );


            if (
                betaOrdersError
            ) {

                throw betaOrdersError;

            }


            if (
                !betaOrders ||
                betaOrders.length === 0
            ) {

                return res.status(400).json({
                    error:
                        "No orders found"
                });

            }


            /* -------------------------- */
            /* PRESERVE ORDER */
            /* -------------------------- */

            const orderMap =
                new Map(
                    betaOrders.map(
                        order => [
                            order.id,
                            order
                        ]
                    )
                );


            /* -------------------------- */
            /* VALIDATE ORDERS */
            /* -------------------------- */

            for (
                const orderId
                of orderIds
            ) {

                const order =
                    orderMap.get(
                        orderId
                    );


                if (
                    !order
                ) {

                    return res.status(400).json({
                        error:
                            "One or more selected orders could not be found"
                    });

                }


                if (
                    ![
                        "ready",
                        "printed"
                    ].includes(
                        order.status
                    )
                ) {

                    return res.status(400).json({

                        error:
                            `Order ${order.id} is not ready for printing`

                    });

                }

            }


            /* -------------------------- */
            /* CREATE PDF */
            /* -------------------------- */

            const pdfDoc =
                await PDFDocument.create();


            /* -------------------------- */
            /* ADD ORDERS */
            /* -------------------------- */

            for (
                const orderId
                of orderIds
            ) {

                const order =
                    orderMap.get(
                        orderId
                    );


                await addOrderToPdf(
                    pdfDoc,
                    order
                );

            }


            /* -------------------------- */
            /* SAVE PDF */
            /* -------------------------- */

            const pdfBytes =
                await pdfDoc.save();


            /* -------------------------- */
            /* RETURN PDF */
            /* -------------------------- */

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );


            const filename =
                orderIds.length === 1
                    ? "tiny-photo-club-beta-print-sheet.pdf"
                    : "tiny-photo-club-beta-print-batch.pdf";


            res.setHeader(
                "Content-Disposition",
                `inline; filename="${filename}"`
            );


            return res.status(200).send(
                Buffer.from(
                    pdfBytes
                )
            );

        }


        catch (error) {

            console.error(
                "Generate beta print sheet error:",
                error
            );

            return res.status(500).json({

                error:
                    error.message ||
                    "Unable to generate print sheet"

            });

        }

    };