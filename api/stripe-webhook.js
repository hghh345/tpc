const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
    "https://cvuyybeihtvhygxukbuj.supabase.co",
    process.env.SUPABASE_SECRET_KEY
);

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
    }

    try {

        const signature = req.headers["stripe-signature"];

        /*
           Get the raw request body.
           Stripe requires the original body for
           webhook signature verification.
        */

        const rawBody = await getRawBody(req);

        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Stripe event:", event.type);


        /*
           Successful Checkout
        */

        if (event.type === "checkout.session.completed") {

            const session = event.data.object;

            const email =
                session.customer_details?.email ||
                session.customer_email;

            console.log(
                "Successful checkout:",
                email
            );


            /*
               Create Supabase user
            */

            const {
                data: userData,
                error: userError
            } = await supabase.auth.admin.createUser({

                email: email,

                email_confirm: true

            });


            if (userError) {

                console.error(
                    "Supabase user error:",
                    userError
                );

                return res.status(500).json({
                    error: "Could not create user"
                });

            }


            console.log(
                "Created Supabase user:",
                userData.user.id
            );

        }


        return res.status(200).json({
            received: true
        });


    } catch (error) {

        console.error(
            "Webhook error:",
            error
        );

        return res.status(400).json({
            error: "Webhook failed"
        });

    }

};


/*
   Read the raw request body.
*/

function getRawBody(req) {

    return new Promise((resolve, reject) => {

        const chunks = [];

        req.on("data", chunk => {

            chunks.push(
                Buffer.isBuffer(chunk)
                    ? chunk
                    : Buffer.from(chunk)
            );

        });

        req.on("end", () => {

            resolve(
                Buffer.concat(chunks)
            );

        });

        req.on("error", reject);

    });

}


/*
   Disable Vercel's automatic JSON body parsing.
*/

module.exports.config = {

    api: {
        bodyParser: false
    }

};