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
                password,
                betaOrderId,
                status
            } =
                req.body;


            /* -------------------------- */
            /* PASSWORD */
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
            /* VALIDATE */
            /* -------------------------- */

            if (
                !betaOrderId ||
                !status
            ) {

                return res.status(400).json({
                    error:
                        "Missing order information"
                });

            }


            const allowedStatuses = [
                "printed",
                "fulfilled"
            ];


            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    error:
                        "Invalid status"
                });

            }


            /* -------------------------- */
            /* UPDATE */
            /* -------------------------- */

            const {
                data: order,
                error
            } =
                await supabase
                    .from("beta_orders")
                    .update({
                        status:
                            status
                    })
                    .eq(
                        "id",
                        betaOrderId
                    )
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            return res.status(200).json({
                success:
                    true,
                order:
                    order
            });

        }


        catch (error) {

            console.error(
                "Update beta order error:",
                error
            );


            return res.status(500).json({
                error:
                    "Unable to update beta order"
            });

        }

    };