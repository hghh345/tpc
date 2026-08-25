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

        const rawBody = await getRawBody(req);

        const event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        console.log("Stripe event:", event.type);


        /* -------------------------------- */
        /* CHECKOUT COMPLETED */
        /* -------------------------------- */

        if (event.type === "checkout.session.completed") {

            const session = event.data.object;

            const email =
                session.customer_details?.email ||
                session.customer_email;

            const stripeCustomerId =
                session.customer;

            const stripeSubscriptionId =
                session.subscription;

            const plan =
                session.metadata?.plan;


            console.log("Successful checkout:", email);
            console.log("Stripe customer:", stripeCustomerId);
            console.log("Stripe subscription:", stripeSubscriptionId);
            console.log("Plan:", plan);


            /* -------------------------------- */
            /* CREATE SUPABASE USER */
            /* -------------------------------- */

            const {
                data: userData,
                error: userError
            } = await supabase.auth.admin.createUser({

                email: email,

                email_confirm: true

            });


            /*
               If the user already exists because Stripe
               retried the webhook, find the existing user.
            */

            let userId;

            if (userError) {

                if (
                    userError.message &&
                    userError.message.toLowerCase().includes("already")
                ) {

                    const {
                        data: usersData,
                        error: listError
                    } = await supabase.auth.admin.listUsers();

                    if (listError) {
                        throw listError;
                    }

                    const existingUser =
                        usersData.users.find(
                            user => user.email === email
                        );

                    if (!existingUser) {
                        throw userError;
                    }

                    userId = existingUser.id;

                } else {

                    throw userError;

                }

            } else {

                userId = userData.user.id;

            }


            console.log(
                "Supabase user:",
                userId
            );


            /* -------------------------------- */
            /* CREATE SUBSCRIPTION */
            /* -------------------------------- */

            const {
                data: subscriptionData,
                error: subscriptionError
            } = await supabase
                .from("subscriptions")
                .insert({

                    user_id: userId,

                    stripe_customer_id:
                        stripeCustomerId,

                    stripe_subscription_id:
                        stripeSubscriptionId,

                    plan: plan,

                    status: "active"

                })
                .select()
                .single();


            if (subscriptionError) {

                console.error(
                    "Subscription error:",
                    subscriptionError
                );

                throw subscriptionError;

            }


            console.log(
                "Created subscription:",
                subscriptionData.id
            );


            /* -------------------------------- */
            /* CREATE FIRST PRINT CYCLE */
            /* -------------------------------- */

            const {
                data: cycleData,
                error: cycleError
            } = await supabase
                .from("print_cycles")
                .insert({

                    user_id: userId,

                    subscription_id:
                        subscriptionData.id,

                    cycle_number: 1,

                    status: "open"

                })
                .select()
                .single();


            if (cycleError) {

                console.error(
                    "Print cycle error:",
                    cycleError
                );

                throw cycleError;

            }


            console.log(
                "Created print cycle:",
                cycleData.id
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


/* -------------------------------- */
/* RAW REQUEST BODY */
/* -------------------------------- */

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


module.exports.config = {

    api: {
        bodyParser: false
    }

};