const Stripe = require("stripe");

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);


module.exports = async (req, res) => {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        const {
            sessionId
        } = req.body;


        if (!sessionId) {

            return res.status(400).json({
                error: "Missing Stripe session ID"
            });

        }


        /*
           Ask Stripe for the Checkout Session.

           This means we are NOT trusting the
           browser to tell us whether payment
           actually happened.
        */

        const session =
            await stripe.checkout.sessions.retrieve(
                sessionId
            );


        /*
           Make sure this was actually paid.
        */

        if (
            session.payment_status !== "paid"
        ) {

            return res.status(400).json({
                error: "Payment has not been completed"
            });

        }


        /*
           Return only the information our
           success page needs.
        */

        return res.status(200).json({

            paid: true,

            photoSessionId:
                session.metadata?.photoSessionId,

            customerEmail:
                session.customer_details?.email ||
                session.customer_email,

            customerId:
                session.customer,

            subscriptionId:
                session.subscription

        });

    }

    catch (error) {

        console.error(
            "Checkout session error:",
            error
        );


        return res.status(500).json({
            error:
                "Unable to verify checkout session"
        });

    }

};