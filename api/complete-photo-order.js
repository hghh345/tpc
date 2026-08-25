const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);

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
            sessionId,
            photoSessionId,
            photos
        } = req.body;


        /*
           Make sure the browser sent everything.
        */

        if (
            !sessionId ||
            !photoSessionId ||
            !photos ||
            !Array.isArray(photos)
        ) {

            return res.status(400).json({
                error: "Missing order information"
            });

        }
        const totalPrints =
         photos.reduce(
        (total, photo) =>
            total + photo.quantity,
        0
         );

        if (photos.length !== 12) {

            return res.status(400).json({
                error: "Exactly 12 photos are required"
            });

        }


        /*
           Verify the Stripe payment directly
           with Stripe.
        */

        const session =
            await stripe.checkout.sessions.retrieve(
                sessionId
            );


        if (
            session.payment_status !== "paid"
        ) {

            return res.status(400).json({
                error: "Payment has not been completed"
            });

        }


        /*
           Make sure the photoSessionId supplied
           by the browser is the SAME one that
           Stripe recorded.
        */

        if (
            session.metadata?.photoSessionId !==
            photoSessionId
        ) {

            return res.status(400).json({
                error: "Photo session does not match payment"
            });

        }


        /*
           Get customer information from Stripe.
        */

        const email =
            session.customer_details?.email ||
            session.customer_email;


        const stripeCustomerId =
            session.customer;


        const stripeSubscriptionId =
            session.subscription;


        if (!email) {

            return res.status(400).json({
                error: "No customer email found"
            });

        }


        /*
           Find the Supabase user.
        */

        const {
            data: usersData,
            error: usersError
        } =
            await supabase.auth.admin.listUsers();


        if (usersError) {

            throw usersError;

        }


        const user =
            usersData.users.find(
                user =>
                    user.email?.toLowerCase() ===
                    email.toLowerCase()
            );


        if (!user) {

            return res.status(404).json({
                error: "Supabase user not found"
            });

        }


        /*
           Find the customer's active subscription.
        */

        const {
            data: subscription,
            error: subscriptionError
        } =
            await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", user.id)
                .eq(
                    "stripe_subscription_id",
                    stripeSubscriptionId
                )
                .single();


        if (subscriptionError) {

            throw subscriptionError;

        }


        /*
           Find the current print cycle.
        */

        const {
            data: printCycle,
            error: printCycleError
        } =
            await supabase
                .from("print_cycles")
                .select("*")
                .eq("user_id", user.id)
                .eq(
                    "subscription_id",
                    subscription.id
                )
                .eq("status", "selecting")
                .order(
                    "cycle_number",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .single();


        if (printCycleError) {

            throw printCycleError;

        }


        /*
           Upload each photo to Supabase Storage.
        */

        const uploadedPhotos = [];


        for (
            let index = 0;
            index < photos.length;
            index++
        ) {

            const photo =
                photos[index];


            /*
               Convert the base64 data URL sent
               by the browser into binary data.
            */

            const matches =
                photo.data.match(
                    /^data:(.+);base64,(.+)$/
                );


            if (!matches) {

                throw new Error(
                    "Invalid photo data"
                );

            }


            const contentType =
                matches[1];


            const base64Data =
                matches[2];


            const buffer =
                Buffer.from(
                    base64Data,
                    "base64"
                );


            /*
               Give every uploaded file a unique
               storage path.
            */

            const extension =
                contentType.split("/")[1] ||
                "jpg";


            const storagePath =
                `${user.id}/${printCycle.id}/${photo.id}.${extension}`;


            const {
                error: uploadError
            } =
                await supabase
                    .storage
                    .from("customer photos")
                    .upload(
                        storagePath,
                        buffer,
                        {
                            contentType:
                                contentType,

                            upsert:
                                false
                        }
                    );


            if (uploadError) {

                throw uploadError;

            }


            /*
               Create the database photo row.
            */

            const {
                data: photoRow,
                error: photoError
            } =
                await supabase
                    .from("photos")
                    .insert({

                        user_id:
                            user.id,

                        print_cycle_id:
                            printCycle.id,

                        storage_path:
                            storagePath

                    })
                    .select()
                    .single();


            if (photoError) {

                throw photoError;

            }


            uploadedPhotos.push({

                photoRow:
                    photoRow,

                quantity:
                    photo.quantity

            });

        }


        /*
           Create selected_photos rows.
        */

        for (
            const uploadedPhoto
            of uploadedPhotos
        ) {

            const {
                error: selectedError
            } =
                await supabase
                    .from("selected_photos")
                    .insert({

                        user_id:
                            user.id,

                        print_cycle_id:
                            printCycle.id,

                        photo_id:
                            uploadedPhoto.photoRow.id,

                        quantity:
                            uploadedPhoto.quantity

                    });


            if (selectedError) {

                throw selectedError;

            }

        }


        /*
           The customer has successfully
           completed their dozen.
        */

        const {
            error: updateError
        } =
            await supabase
                .from("print_cycles")
                .update({

                    status:
                        "ready"

                })
                .eq(
                    "id",
                    printCycle.id
                );


        if (updateError) {

            throw updateError;

        }


        return res.status(200).json({

            success:
                true,

            photosUploaded:
                uploadedPhotos.length

        });

    }


    catch (error) {

        console.error(
            "Complete photo order error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to complete photo order"

        });

    }

};