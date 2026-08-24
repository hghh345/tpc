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

        const signature =
            req.headers["stripe-signature"];


        /*
           Verify that this request actually came
           from Stripe.
        */

        const event =
            stripe.webhooks.constructEvent(
                req.body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );


        console.log(
            "Stripe event:",
            event.type
        );


        /*
           We only care about completed Checkout
           sessions for now.
        */

        if (event.type !== "checkout.session.completed") {

            return res.status(200).json({
                received: true
            });

        }


        const session = event.data.object;


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

            console.error(
                "No customer email found."
            );

            return res.status(400).json({
                error: "No customer email"
            });

        }


        /*
           Get our Tiny Photo Club plan.
        */

        const plan =
            session.metadata?.plan;


        if (!plan) {

            console.error(
                "No plan found in Stripe metadata."
            );

            return res.status(400).json({
                error: "No plan"
            });

        }


        console.log(
            "Customer:",
            email
        );

        console.log(
            "Plan:",
            plan
        );


        /*
           Try to find the Supabase user first.
        */

        const {
            data: usersData,
            error: usersError
        } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 1000
        });


        if (usersError) {

            console.error(
                "Could not retrieve users:",
                usersError
            );

            return res.status(500).json({
                error: "Could not retrieve users"
            });

        }


        let user =
            usersData.users.find(
                existingUser =>
                    existingUser.email?.toLowerCase() ===
                    email.toLowerCase()
            );


        /*
           If this customer doesn't have a
           Supabase account yet, create one.
        */

        if (!user) {

            const {
                data: newUserData,
                error: newUserError
            } = await supabase.auth.admin.createUser({

                email: email,

                email_confirm: true

            });


            if (newUserError) {

                console.error(
                    "Could not create user:",
                    newUserError
                );

                return res.status(500).json({
                    error: "Could not create user"
                });

            }

            user = newUserData.user;

        }


        const userId = user.id;


        console.log(
            "Supabase user:",
            userId
        );


        /*
           Create the subscription record.
        */

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

            return res.status(500).json({
                error: "Could not create subscription"
            });

        }


        console.log(
            "Subscription created:",
            subscriptionData.id
        );


        /*
           Create the customer's first print cycle.
        */

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

                status: "pending"

            })
            .select()
            .single();


        if (cycleError) {

            console.error(
                "Print cycle error:",
                cycleError
            );

            return res.status(500).json({
                error: "Could not create print cycle"
            });

        }


        console.log(
            "Print cycle created:",
            cycleData.id
        );


        return res.status(200).json({
            received: true
        });

    }


    catch (error) {

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
   Stripe requires the raw request body
   for signature verification.
*/

module.exports.config = {

    api: {
        bodyParser: false
    }

};