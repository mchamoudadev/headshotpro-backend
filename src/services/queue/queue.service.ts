
import { AppError } from "@/util/errors";
import { logger } from "@/util/logger";
import { Inngest } from "inngest";
import { getCreditAdditionFunction, ICreditAdditionData } from "@/services/queue";
import { inngestClient } from "@/services/queue";
import { createGenerateHeadshotFunction, GenerateHeadshotEventData } from "./headshot.queue";



export function getClient() : Inngest {
    return inngestClient;
}


export function getQueueFunctions() {
    return [
        getCreditAdditionFunction(),
        createGenerateHeadshotFunction(),
    ]
}

// Trigger credit addition

export async function triggerCreditAddition(data : ICreditAdditionData
) : Promise<void> {


    try {
        await inngestClient.send({
            name: "payment/credits-add",
            data
        })

        logger.info(`Credit addition triggered for order ${data.orderId} with ${data.credits} credits`);
    } catch (error) {
        logger.error(`Failed to trigger credit addition for order ${data.orderId} with ${data.credits} credits`, error);
        throw new AppError("Failed to trigger credit addition", 500, "FAILED_TO_TRIGGER_CREDIT_ADDITION");
    }
}

// Trigger headshot generation

export async function triggerHeadshotGeneration(data : GenerateHeadshotEventData) : Promise<void> {


    try {

        await inngestClient.send({
            name: "headshot/generate",
            data
        })

    }catch(error) {
        logger.error(`Failed to trigger headshot generation for headshot ${data.headshotId}`, error);
        throw new AppError("Failed to trigger headshot generation", 500, "FAILED_TO_TRIGGER_HEADSHOT_GENERATION");
    }





}