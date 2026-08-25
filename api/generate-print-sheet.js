const { createClient } = require("@supabase/supabase-js");
const { PDFDocument, rgb } = require("pdf-lib");


const supabase = createClient(
    "https://cvuyybeihtvhygxukbuj.supabase.co/",
    process.env.SUPABASE_SECRET_KEY
);


/*
   A4 landscape dimensions in points.

   1 inch = 72 points
   1 inch = 2.54 cm

   A4:
   29.7 cm × 21 cm
*/

const A4_WIDTH =
    29.7 / 2.54 * 72;

const A4_HEIGHT =
    21 / 2.54 * 72;


/*
   Finished print:

   10 × 10 cm

   Photo:

   8 × 8 cm

   White border:

   1 cm on every side
*/

const PRINT_SIZE =
    10 / 2.54 * 72;

const PHOTO_SIZE =
    8 / 2.54 * 72;


/*
   Layout:

   3 columns × 2 rows

   Six prints per page.
*/

const COLUMNS = 3;
const ROWS = 2;

const SIDE_MARGIN =
    (A4_WIDTH - (PRINT_SIZE * COLUMNS)) / 2;

const TOP_MARGIN =
    (A4_HEIGHT - (PRINT_SIZE * ROWS)) / 2;


/*
   Small cut marks.

   These extend slightly outside
   each 10 × 10 cm print.
*/

const CUT_MARK_LENGTH = 8;


/* -------------------------- */
/* Helpers */
/* -------------------------- */

async function getImageBytes(
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


/*
   Draw crop marks around
   a 10 × 10 cm print.
*/

function drawCutMarks(
    page,
    x,
    y
) {

    const lineWidth = 0.5;


    /*
       Bottom-left
    */

    page.drawLine({

        start: {
            x: x - CUT_MARK_LENGTH,
            y: y
        },

        end: {
            x: x - 2,
            y: y
        },

        thickness:
            lineWidth,

        color:
            rgb(0, 0, 0)

    });


    page.drawLine({

        start: {
            x: x,
            y: y - CUT_MARK_LENGTH
        },

        end: {
            x: x,
            y: y - 2
        },

        thickness:
            lineWidth,

        color:
            rgb(0, 0, 0)

    });


    /*
       Bottom-right
    */

    page.drawLine({

        start: {
            x: x + PRINT_SIZE + 2,
            y: y
        },

        end: {
            x:
                x +
                PRINT_SIZE +
                CUT_MARK_LENGTH,

            y: y
        },

        thickness:
            lineWidth,

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

        thickness:
            lineWidth,

        color:
            rgb(0, 0, 0)

    });


    /*
       Top-left
    */

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

        thickness:
            lineWidth,

        color:
            rgb(0, 0, 0)

    });


    page.drawLine({

        start: {
            x: x,

            y:
                y +
                PRINT_SIZE +
                2
        },

        end: {
            x: x,

            y:
                y +
                PRINT_SIZE +
                CUT_MARK_LENGTH
        },

        thickness:
            lineWidth,

        color:
            rgb(0, 0, 0)

    });


    /*
       Top-right
    */

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

        thickness:
            lineWidth,

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

        thickness:
            lineWidth,

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
            password
        } = req.body;


        /*
           Protect this endpoint
           with the same admin password.
        */

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


        /*
           Find the most recent
           ready print cycle.
        */

        const {
            data: printCycle,
            error: printCycleError
        } =
            await supabase
                .from("print_cycles")
                .select("*")
                .eq(
                    "status",
                    "ready"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .single();


        if (
            printCycleError
        ) {

            throw printCycleError;

        }


        /*
           Find selected photos.
        */

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
                    printCycle.id
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


        /*
           Turn selected photos into
           physical print slots.

           quantity = 2 means the same
           image appears twice.
        */

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


        /*
           Create PDF.
        */

        const pdfDoc =
            await PDFDocument.create();


        /*
           Process six prints per page.
        */

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


            /*
               White A4 background.
            */

            page.drawRectangle({

                x: 0,
                y: 0,

                width:
                    A4_WIDTH,

                height:
                    A4_HEIGHT,

                color:
                    rgb(1, 1, 1)

            });


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


                /*
                   Get image from Supabase.
                */

                const imageBytes =
                    await getImageBytes(
                        slot.storagePath
                    );


                /*
                   Determine image type.
                */

                let image;


                if (
                    slot.storagePath
                        .toLowerCase()
                        .endsWith(".png")
                ) {

                    image =
                        await pdfDoc.embedPng(
                            imageBytes
                        );

                }

                else {

                    image =
                        await pdfDoc.embedJpg(
                            imageBytes
                        );

                }


                /*
                   Grid position.
                */

                const column =
                    slotIndex % COLUMNS;

                const row =
                    Math.floor(
                        slotIndex / COLUMNS
                    );


                const x =
                    SIDE_MARGIN +
                    column *
                    PRINT_SIZE;


                const y =
                    TOP_MARGIN +
                    (ROWS - 1 - row) *
                    PRINT_SIZE;


                /*
                   White 10 × 10 cm print.
                */

                page.drawRectangle({

                    x:
                        x,

                    y:
                        y,

                    width:
                        PRINT_SIZE,

                    height:
                        PRINT_SIZE,

                    color:
                        rgb(1, 1, 1)

                });


                /*
                   Center crop image
                   into an 8 × 8 cm square.

                   We calculate the largest
                   centered square from the
                   original image.
                */

                const imageWidth =
                    image.width;

                const imageHeight =
                    image.height;


                const squareSize =
                    Math.min(
                        imageWidth,
                        imageHeight
                    );


                const cropX =
                    (
                        imageWidth -
                        squareSize
                    ) / 2;


                const cropY =
                    (
                        imageHeight -
                        squareSize
                    ) / 2;


                /*
                   Put the photo inside
                   the 1 cm white border.
                */

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
                            PHOTO_SIZE,

                        /*
                           Crop the image
                           to a square.
                        */

                        clip: {

                            x:
                                cropX,

                            y:
                                cropY,

                            width:
                                squareSize,

                            height:
                                squareSize

                        }

                    }
                );


                /*
                   Add cut marks.
                */

                drawCutMarks(
                    page,
                    x,
                    y
                );

            }

        }


        /*
           Save PDF.
        */

        const pdfBytes =
            await pdfDoc.save();


        /*
           Send PDF to browser.
        */

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            'inline; filename="tiny-photo-club-test.pdf"'
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