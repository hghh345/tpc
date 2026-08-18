const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    "https://YOUR-SUPABASE-PROJECT.supabase.co",
    process.env.SUPABASE_SECRET_KEY
);


module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res.status(405).send("Method not allowed");

    }


    try {

        /*
           Stripe sends the webhook as raw JSON.
        */

        const event = req.body;


        /*
           For now, we're only listening for
           successful Checkout sessions.
        */

        if (event.type !== "checkout.session.completed") {

            return res.status(200).json({
                received: true
            });

        }


        const session = event.data.object;


        /*
           Get the customer's email.
        */

        const email =
            session.customer_details?.email ||
            session.customer_email;


        if (!email) {

            console.error(
                "No customer email found."
            );

            return res.status(400).json({
                error: "No customer email"
            });

        }


        /*
           Create the Supabase Auth user.
        */

        const {
            data: userData,
            error: userError
        } = await supabase.auth.admin.createUser({

            email: email,

            email_confirm: true

        });


        if (userError) {

            /*
               If the user already exists,
               we'll handle that properly next.
            */

            console.error(userError);

            return res.status(500).json({
                error: "Could not create user"
            });

        }


        const userId = userData.user.id;


        console.log(
            "Created Supabase user:",
            userId
        );


        return res.status(200).json({
            received: true,
            user_id: userId
        });


    }

    catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Webhook failed"
        });

    }

};