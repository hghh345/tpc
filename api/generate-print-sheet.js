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

/*
   A4 landscape:
   297 × 210 mm
*/

const A4_WIDTH =
    297 / 25.4 * 72;

const A4_HEIGHT =
    210 / 25.4 * 72;


/*
   Finished print:
   100 × 100 mm
*/

const PRINT_SIZE =
    100 / 25.4 * 72;


/*
   Actual photo:
   80 × 80 mm
*/

const PHOTO_SIZE =
    80 / 25.4 * 72;


/*
   3 columns × 2 rows
*/

const COLUMNS = 3;
const ROWS = 2;


/*
   Center the 3 × 2 grid
   on the A4 page.
*/

const GRID_WIDTH =
    PRINT_SIZE * COLUMNS;

const GRID_HEIGHT =
    PRINT_SIZE * ROWS;

const LEFT_MARGIN =
    (A4_WIDTH - GRID_WIDTH) / 2;

const BOTTOM_MARGIN =
    (A4_HEIGHT - GRID_HEIGHT) / 2;


/*
   Cut mark length.
*/

const CUT_MARK_LENGTH = 8;


/* -------------------------- */
/* STORAGE */
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

    /*
       Read the original dimensions.
    */

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


    /*
       Take the largest possible
       centered square.
    */

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


    /*
       Crop to square.

       We don't resize to a physical
       dimension here because the PDF
       determines the physical size.
    */

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


    /*
       bottom-left
    */

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


    /*
       bottom-right
    */

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


    /*
       top-left
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


    /*
       top-right
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
            password
        } = req.body;


        /*
           Protect the test endpoint.
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
           Get the selected photos
           and their photo records.
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
           Turn quantities into
           physical print slots.
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
           Two pages.
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
               Six prints on each page.
            */

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
                   Download original photo.
                */

                const originalBuffer =
                    await downloadPhoto(
                        slot.storagePath
                    );


                /*
                   Convert to centered
                   square.
                */

                const squareBuffer =
                    await makeSquarePhoto(
                        originalBuffer
                    );


                /*
                   Embed the cropped
                   JPEG into the PDF.
                */

                const image =
                    await pdfDoc.embedJpg(
                        squareBuffer
                    );


                /*
                   Determine grid position.
                */

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


                /*
                   White 10 × 10 cm
                   finished print.
                */

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


                /*
                   Place the 8 × 8 photo
                   in the center.

                   1 cm border on every side.
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
                            PHOTO_SIZE

                    }
                );


                /*
                   Cut marks.
                */

                drawCutMarks(
                    page,
                    x,
                    y
                );

            }

        }


        /*
           Generate PDF bytes.
        */

        const pdfBytes =
            await pdfDoc.save();


        /*
           Return PDF.
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