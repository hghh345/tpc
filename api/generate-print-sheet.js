const { createClient } = require("@supabase/supabase-js");
const { PDFDocument, rgb } = require("pdf-lib");
const sharp = require("sharp");

const supabase = createClient(
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

const COLUMNS = 3;
const ROWS = 2;

const GRID_WIDTH =
    PRINT_SIZE * COLUMNS;

const GRID_HEIGHT =
    PRINT_SIZE * ROWS;

const LEFT_MARGIN =
    (A4_WIDTH - GRID_WIDTH) / 2;

const BOTTOM_MARGIN =
    (A4_HEIGHT - GRID_HEIGHT) / 2;

const CUT_MARK_LENGTH = 8;


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

            left:
                left,

            top:
                top,

            width:
                squareSize,

            height:
                squareSize

        })
        .jpeg({
            quality: 95
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


    /* bottom-left */

    page.drawLine({

        start: {
            x:
                x -
                CUT_MARK_LENGTH,

            y:
                y
        },

        end: {
            x:
                x - 2,

            y:
                y
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    page.drawLine({

        start: {
            x:
                x,

            y:
                y -
                CUT_MARK_LENGTH
        },

        end: {
            x:
                x,

            y:
                y - 2
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    /* bottom-right */

    page.drawLine({

        start: {
            x:
                x +
                PRINT_SIZE +
                2,

            y:
                y
        },

        end: {
            x:
                x +
                PRINT_SIZE +
                CUT_MARK_LENGTH,

            y:
                y
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    page.drawLine({

        start: {
            x:
                x +
                PRINT_SIZE,

            y:
                y -
                CUT_MARK_LENGTH
        },

        end: {
            x:
                x +
                PRINT_SIZE,

            y:
                y - 2
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    /* top-left */

    page.drawLine({

        start: {
            x:
                x -
                CUT_MARK_LENGTH,

            y:
                y +
                PRINT_SIZE
        },

        end: {
            x:
                x - 2,

            y:
                y +
                PRINT_SIZE
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    page.drawLine({

        start: {
            x:
                x,

            y:
                y +
                PRINT_SIZE +
                2
        },

        end: {
            x:
                x,

            y:
                y +
                PRINT_SIZE +
                CUT_MARK_LENGTH
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    /* top-right */

    page.drawLine({

        start: {
            x:
                x +
                PRINT_SIZE +
                2,

            y:
                y +
                PRINT_SIZE
        },

        end: {
            x:
                x +
                PRINT_SIZE +
                CUT_MARK_LENGTH,

            y:
                y +
                PRINT_SIZE
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });


    page.drawLine({

        start: {
            x:
                x +
                PRINT_SIZE,

            y:
                y +
                PRINT_SIZE +
                2
        },

        end: {
            x:
                x +
                PRINT_SIZE,

            y:
                y +
                PRINT_SIZE +
                CUT_MARK_LENGTH
        },

        thickness,
        color:
            rgb(0, 0, 0)

    });

}


/* -------------------------- */
/* API */
/* -------------------------- */

module.exports = async (
    req,
    res
) => {

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
            printCycleId
        } = req.body;


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
        /* PRINT CYCLE ID */
        /* -------------------------- */

        if (!printCycleId) {

            return res.status(400).json({

                error:
                    "Missing print cycle ID"

            });

        }


        /* -------------------------- */
        /* FIND SPECIFIC PRINT CYCLE */
        /* -------------------------- */

        const {
            data: printCycle,
            error: printCycleError
        } =
            await supabase
                .from("print_cycles")
                .select(`
                    id,
                    status
                `)
                .eq(
                    "id",
                    printCycleId
                )
                .single();


        if (
            printCycleError
        ) {

            throw printCycleError;

        }


        /*
           Only generate sheets for
           orders that are ready or
           already printed.
        */

        if (
            ![
                "ready",
                "printed"
            ].includes(
                printCycle.status
            )
        ) {

            return res.status(400).json({

                error:
                    "This order is not ready for printing"

            });

        }


        /* -------------------------- */
        /* SELECTED PHOTOS */
        /* -------------------------- */

        const {
            data: selectedPhotos,
            error: selectedError
        } =
            await supabase
                .from("selected_photos")
                .select(`
                    photo_id,
                    quantity,
                    photos (
                        storage_path
                    )
                `)
                .eq(
                    "print_cycle_id",
                    printCycleId
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (
            selectedError
        ) {

            throw selectedError;

        }


        /* -------------------------- */
        /* CREATE PRINT SLOTS */
        /* -------------------------- */

        const printSlots = [];


        for (
            const selected
            of selectedPhotos
        ) {

            if (
                !selected.photos ||
                !selected.photos.storage_path
            ) {

                continue;

            }


            for (
                let i = 0;
                i < selected.quantity;
                i++
            ) {

                printSlots.push({

                    photoId:
                        selected.photo_id,

                    storagePath:
                        selected.photos.storage_path

                });

            }

        }


        if (
            printSlots.length !== 12
        ) {

            return res.status(400).json({

                error:
                    `Expected 12 prints but found ${printSlots.length}`

            });

        }


        /* -------------------------- */
        /* CREATE PDF */
        /* -------------------------- */

        const pdfDoc =
            await PDFDocument.create();


        for (
            let pageIndex = 0;
            pageIndex < 2;
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
                slotIndex < pageSlots.length;
                slotIndex++
            ) {

                const slot =
                    pageSlots[slotIndex];


                /* -------------------------- */
                /* DOWNLOAD PHOTO */
                /* -------------------------- */

                const originalBuffer =
                    await downloadPhoto(
                        slot.storagePath
                    );


                /* -------------------------- */
                /* CENTER CROP */
                /* -------------------------- */

                const squareBuffer =
                    await makeSquarePhoto(
                        originalBuffer
                    );


                /* -------------------------- */
                /* EMBED IMAGE */
                /* -------------------------- */

                const image =
                    await pdfDoc.embedJpg(
                        squareBuffer
                    );


                /* -------------------------- */
                /* GRID POSITION */
                /* -------------------------- */

                const column =
                    slotIndex % COLUMNS;

                const row =
                    Math.floor(
                        slotIndex / COLUMNS
                    );


                const x =
                    LEFT_MARGIN +
                    column *
                    PRINT_SIZE;


                const y =
                    BOTTOM_MARGIN +
                    (ROWS - 1 - row) *
                    PRINT_SIZE;


                /* -------------------------- */
                /* WHITE PRINT */
                /* -------------------------- */

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


                /* -------------------------- */
                /* PHOTO */
                /* -------------------------- */

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


                /* -------------------------- */
                /* CUT MARKS */
                /* -------------------------- */

                drawCutMarks(
                    page,
                    x,
                    y
                );

            }

        }


        /* -------------------------- */
        /* SAVE PDF */
        /* -------------------------- */

        const pdfBytes =
            await pdfDoc.save();


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            'inline; filename="tiny-photo-club-print-sheet.pdf"'
        );


        return res.status(200).send(
            Buffer.from(pdfBytes)
        );

    }


    catch (error) {

        console.error(
            "Print sheet error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to generate print sheet"

        });

    }

};