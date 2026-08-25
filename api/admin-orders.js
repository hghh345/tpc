const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    "https://cvuyybeihtvhygxukbuj.supabase.co/",
    process.env.SUPABASE_SECRET_KEY
);


module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        const {
            password
        } = req.body;


        /* -------------------------- */
        /* Check admin password */
        /* -------------------------- */

        if (
            !password ||
            password !== process.env.ADMIN_PASSWORD
        ) {

            return res.status(401).json({
                error: "Unauthorized"
            });

        }


        /* -------------------------- */
        /* Find ready print cycles */
        /* -------------------------- */

        const {
            data: printCycles,
            error: printCycleError
        } =
            await supabase
                .from("print_cycles")
                .select(`
                    id,
                    user_id,
                    subscription_id,
                    cycle_number,
                    status,
                    created_at
                `)
                .in(
                    "status",
                    [
                        "ready",
                        "printed",
                        "shipped"
                    ]
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (printCycleError) {

            throw printCycleError;

        }


        /* -------------------------- */
        /* Build order information */
        /* -------------------------- */

        const orders = [];


        for (
            const cycle
            of printCycles
        ) {

            /* -------------------------- */
            /* Subscription */
            /* -------------------------- */

            const {
                data: subscription,
                error: subscriptionError
            } =
                await supabase
                    .from("subscriptions")
                    .select(`
                        plan,
                        stripe_customer_id,
                        stripe_subscription_id
                    `)
                    .eq(
                        "id",
                        cycle.subscription_id
                    )
                    .single();


            if (subscriptionError) {

                throw subscriptionError;

            }


            /* -------------------------- */
            /* Customer email */
            /* -------------------------- */

            const {
                data: userData,
                error: userError
            } =
                await supabase.auth.admin.getUserById(
                    cycle.user_id
                );


            if (userError) {

                throw userError;

            }


            /* -------------------------- */
            /* Selected photos */
            /* -------------------------- */

            const {
                data: selectedPhotos,
                error: selectedError
            } =
                await supabase
                    .from("selected_photos")
                    .select(`
                        id,
                        photo_id,
                        quantity,
                        photos (
                            id,
                            storage_path
                        )
                    `)
                    .eq(
                        "print_cycle_id",
                        cycle.id
                    )
                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    );


            if (selectedError) {

                throw selectedError;

            }


            /* -------------------------- */
            /* Temporary photo URLs */
            /* -------------------------- */

            const photos = [];


            for (
                const selected
                of selectedPhotos
            ) {

                if (
                    !selected.photos?.storage_path
                ) {

                    continue;

                }


                const {
                    data: signedUrl,
                    error: signedUrlError
                } =
                    await supabase
                        .storage
                        .from("customer-photos")
                        .createSignedUrl(
                            selected.photos.storage_path,
                            3600
                        );


                if (signedUrlError) {

                    throw signedUrlError;

                }


                photos.push({

                    photoId:
                        selected.photo_id,

                    quantity:
                        selected.quantity,

                    url:
                        signedUrl.signedUrl

                });

            }


            /* -------------------------- */
            /* Add order */
            /* -------------------------- */

            orders.push({

                printCycleId:
                    cycle.id,

                userId:
                    cycle.user_id,

                email:
                    userData.user.email,

                plan:
                    subscription.plan,

                cycleNumber:
                    cycle.cycle_number,

                status:
                    cycle.status,

                createdAt:
                    cycle.created_at,

                photos:
                    photos

            });

        }


        /* -------------------------- */
        /* Return orders */
        /* -------------------------- */

        return res.status(200).json({

            success:
                true,

            orders:
                orders

        });

    }


    catch (error) {

        console.error(
            "Admin orders error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to load orders"

        });

    }

};