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
            password,
            printCycleId,
            status
        } = req.body;


        /* -------------------------- */
        /* Check password */
        /* -------------------------- */

        if (
            !password ||
            password !==
                process.env.ADMIN_PASSWORD
        ) {

            return res.status(401).json({
                error: "Unauthorized"
            });

        }


        /* -------------------------- */
        /* Validate status */
        /* -------------------------- */

        const allowedStatuses = [
            "ready",
            "printed",
            "fulfilled"
        ];


        if (
            !printCycleId ||
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({
                error: "Invalid print cycle or status"
            });

        }


        /* -------------------------- */
        /* Update print cycle */
        /* -------------------------- */

        const {
            data,
            error
        } =
            await supabase
                .from("print_cycles")
                .update({
                    status: status
                })
                .eq(
                    "id",
                    printCycleId
                )
                .select()
                .single();


        if (error) {

            throw error;

        }


        return res.status(200).json({

            success:
                true,

            printCycle:
                data

        });

    }


    catch (error) {

        console.error(
            "Update print cycle error:",
            error
        );


        return res.status(500).json({

            error:
                "Unable to update print cycle"

        });

    }

};