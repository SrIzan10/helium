import { z } from "zod";

export const schema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters.")
    .max(20, "Name must be at most 20 characters."),
  iceServers: z.string().superRefine((val, ctx) => {
    // below code is ai generated. i am not writing validation myself istg
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a JSON array",
        });
        return;
      }

      // Validate each ICE server object
      parsed.forEach((item, index) => {
        if (typeof item !== "object" || item === null) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: must be an object`,
          });
          return;
        }

        // Validate urls field - can be string or array of strings
        const { urls } = item;
        if (!urls) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'urls' is required`,
          });
          return;
        }

        const urlsList = Array.isArray(urls) ? urls : [urls];

        if (!Array.isArray(urls) && typeof urls !== "string") {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'urls' must be a string or array of strings`,
          });
          return;
        }

        // Validate each URL in the urls list
        urlsList.forEach((url, urlIndex) => {
          if (typeof url !== "string") {
            ctx.addIssue({
              code: "custom",
              message: `Item ${index}: urls[${urlIndex}] must be a string`,
            });
            return;
          }

          // Validate STUN/TURN URL format (RFC 8829)
          const isValidStunUrl = /^stuns?:.+/.test(url);
          const isValidTurnUrl = /^turns?:.+/.test(url);

          if (!isValidStunUrl && !isValidTurnUrl) {
            ctx.addIssue({
              code: "custom",
              message: `Item ${index}: urls[${urlIndex}] must be a valid STUN (stun:) or TURN (turn:/turns:) URL`,
            });
          }
        });

        // Validate optional fields
        if (item.username !== undefined && typeof item.username !== "string") {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'username' must be a string`,
          });
        }

        if (
          item.credential !== undefined &&
          typeof item.credential !== "string"
        ) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'credential' must be a string`,
          });
        }

        if (
          item.credentialType !== undefined &&
          !["password", "oauth"].includes(item.credentialType)
        ) {
          ctx.addIssue({
            code: "custom",
            message: `Item ${index}: 'credentialType' must be 'password' or 'oauth'`,
          });
        }
      });
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: "Must be valid JSON",
      });
    }
  }),
  default: z.boolean(),
});
