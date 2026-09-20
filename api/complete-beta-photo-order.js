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
            photos
        } = req.body;

        if (
            !sessionId ||
            !photos ||
            !Array.isArray(photos)
        ) {
            return res.status(400).json({
                error: "Missing order information"
            });
        }

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

        const betaOrderId =
            session.metadata?.beta_order_id;

        if (!betaOrderId) {
            return res.status(400).json({
                error: "No beta order found"
            });
        }

        const {
            data: betaOrder,
            error: betaOrderError
        } =
            await supabase
                .from("beta_orders")
                .select("*")
                .eq(
                    "id",
                    betaOrderId
                )
                .single();

        if (betaOrderError) {
            throw betaOrderError;
        }

        if (
            betaOrder.status === "paid" ||
            betaOrder.status === "ready"
        ) {
            return res.status(200).json({
                success: true,
                message:
                    "Order already completed."
            });
        }

        const targetCount =
            Number(betaOrder.pack_size);

        const totalPrints =
            photos.reduce(
                (total, photo) =>
                    total +
                    Number(
                        photo.quantity || 0
                    ),
                0
            );

        if (
            totalPrints !== targetCount
        ) {
            return res.status(400).json({
                error:
                    `Exactly ${targetCount} prints are required.`
            });
        }

        const uploadedPhotos = [];

        for (const photo of photos) {

            if (
                !photo.id ||
                !photo.data
            ) {
                throw new Error(
                    "Invalid photo information"
                );
            }

            const quantity =
                Number(
                    photo.quantity || 0
                );

            if (
                quantity < 1
            ) {
                throw new Error(
                    "Invalid photo quantity"
                );
            }

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

            const extension =
                contentType.split("/")[1] ||
                "jpg";

            const storagePath =
                `beta/${betaOrder.id}/${photo.id}.${extension}`;

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
                                true
                        }
                    );

            if (uploadError) {
                throw uploadError;
            }

            const {
                data: betaPhoto,
                error: betaPhotoError
            } =
                await supabase
                    .from("beta_photos")
                    .insert({
                        beta_order_id:
                            betaOrder.id,
                        photo_id:
                            photo.id,
                        storage_path:
                            storagePath
                    })
                    .select()
                    .single();

            if (betaPhotoError) {
                throw betaPhotoError;
            }

            uploadedPhotos.push({
                betaPhoto:
                    betaPhoto,
                quantity:
                    quantity
            });
        }

        for (const uploadedPhoto of uploadedPhotos) {

            const {
                error: selectedError
            } =
                await supabase
                    .from("beta_selected_photos")
                    .insert({
                        beta_order_id:
                            betaOrder.id,
                        beta_photo_id:
                            uploadedPhoto.betaPhoto.id,
                        quantity:
                            uploadedPhoto.quantity
                    });

            if (selectedError) {
                throw selectedError;
            }
        }

        const {
            error: updateError
        } =
            await supabase
                .from("beta_orders")
                .update({
                    status:
                        "ready"
                })
                .eq(
                    "id",
                    betaOrder.id
                );

        if (updateError) {
            throw updateError;
        }

        return res.status(200).json({
            success:
                true,
            betaOrderId:
                betaOrder.id,
            photosUploaded:
                uploadedPhotos.length,
            totalPrints:
                totalPrints
        });

    } catch (error) {

        console.error(
            "Complete beta photo order error:",
            error
        );

       return res.status(500).json({
    error:
        error.message ||
        "Unable to complete beta photo order"
});
    }
};