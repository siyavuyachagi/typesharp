import { NamingConvention } from "./naming-convention.js";

/**
 * More specific naming convension configuration
 */
export type NamingConventionConfig = {
    file: NamingConvention,
    dir: NamingConvention,
}