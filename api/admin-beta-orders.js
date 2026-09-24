const { createClient } =
    require("@supabase/supabase-js");


const supabase =
    createClient(
        "https://cvuyybeihtvhygxukbuj.supabase.co/",
        process.env.SUPABASE_SECRET_KEY
    );


module.exports =
    async (
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
            } =
                req.body;


            /* -------------------------- */
            /* CHECK ADMIN PASSWORD */
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
            /* FIND BETA ORDERS */
            /* -------------------------- */

            const {
                data: betaOrders,
                error: betaOrdersError
            } =
                await supabase
                    .from("beta_orders")
                    .select(`
                        id,
                        email,
                        pack_size,
                        delivery,
                        amount,
                        status,
                        created_at
                    `)
                    .in(
                        "status",
                        [
                            "ready",
                            "printed",
                            "fulfilled"
                        ]
                    )
                    .order(
                        "created_at",
                        {
                            ascending:
                                false
                        }
                    );


            if (
                betaOrdersError
            ) {

                throw betaOrdersError;

            }


            /* -------------------------- */
            /* BUILD ORDERS */
            /* -------------------------- */

            const orders = [];


            for (
                const order
                of betaOrders
            ) {


                /* -------------------------- */
                /* SELECTED PHOTOS */
                /* -------------------------- */

                const {
                    data: selectedPhotos,
                    error: selectedError
                } =
                    await supabase
                        .from(
                            "beta_selected_photos"
                        )
                        .select(`
                            beta_photo_id,
                            quantity,
                            created_at
                        `)
                        .eq(
                            "beta_order_id",
                            order.id
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
                /* BETA PHOTO RECORDS */
                /* -------------------------- */

                const betaPhotoIds =
                    [
                        ...new Set(
                            selectedPhotos.map(
                                photo =>
                                    photo.beta_photo_id
                            )
                        )
                    ];


                let betaPhotos = [];


                if (
                    betaPhotoIds.length
                ) {

                    const {
                        data,
                        error
                    } =
                        await supabase
                            .from(
                                "beta_photos"
                            )
                            .select(`
                                id,
                                photo_id,
                                storage_path
                            `)
                            .in(
                                "id",
                                betaPhotoIds
                            );


                    if (error) {

                        throw error;

                    }


                    betaPhotos =
                        data || [];

                }


                /* -------------------------- */
                /* PHOTO MAP */
                /* -------------------------- */

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
                /* TEMPORARY PHOTO URLS */
                /* -------------------------- */

                const photos = [];


                for (
                    const selected
                    of selectedPhotos
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


                    const {
                        data: signedUrl,
                        error: signedUrlError
                    } =
                        await supabase
                            .storage
                            .from(
                                "customer-photos"
                            )
                            .createSignedUrl(
                                photo.storage_path,
                                3600
                            );


                    if (
                        signedUrlError
                    ) {

                        throw signedUrlError;

                    }


                    photos.push({

                        photoId:
                            photo.photo_id,

                        quantity:
                            selected.quantity,

                        url:
                            signedUrl.signedUrl

                    });

                }


                /* -------------------------- */
                /* ADD ORDER */
                /* -------------------------- */

                orders.push({

                    betaOrderId:
                        order.id,

                    email:
                        order.email,

                    packSize:
                        order.pack_size,

                    delivery:
                        order.delivery,

                    amount:
                        order.amount,

                    status:
                        order.status,

                    createdAt:
                        order.created_at,

                    photos:
                        photos

                });

            }


            return res.status(200).json({

                success:
                    true,

                orders:
                    orders

            });

        }


        catch (error) {

            console.error(
                "Admin beta orders error:",
                error
            );


            return res.status(500).json({

                error:
                    "Unable to load beta orders"

            });

        }

    };