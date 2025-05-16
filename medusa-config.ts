import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
	projectConfig: {
		databaseUrl: process.env.DATABASE_URL,
		redisUrl: process.env.REDIS_URL,
		workerMode: process.env.MEDUSA_WORKER_MODE as
			| "shared"
			| "worker"
			| "server",
		http: {
			storeCors: process.env.STORE_CORS!,
			adminCors: process.env.ADMIN_CORS!,
			authCors: process.env.AUTH_CORS!,
			jwtSecret: process.env.JWT_SECRET || "supersecret",
			cookieSecret: process.env.COOKIE_SECRET || "supersecret",
		},
	},
	plugins: [
		{
			resolve: "@rokmohar/medusa-plugin-meilisearch",
			options: {
				config: {
					host: process.env.MEILISEARCH_HOST ?? "",
					apiKey: process.env.MEILISEARCH_API_KEY ?? "",
				},
				settings: {
					// The key is used as the index name in Meilisearch
					products: {
						// Required: Index type
						type: "products",
						// Optional: Whether the index is enabled. When disabled:
						// - Index won't be created or updated
						// - Documents won't be added or removed
						// - Index won't be included in searches
						// - All operations will be silently skipped
						enabled: true,
						// Optional: Specify which fields to include in the index
						// If not specified, all fields will be included
						fields: [
							"id",
							"title",
							"description",
							"handle",
							"variant_sku",
							"thumbnail",
						],
						indexSettings: {
							searchableAttributes: ["title", "description", "variant_sku"],
							displayedAttributes: [
								"id",
								"handle",
								"title",
								"description",
								"variant_sku",
								"thumbnail",
							],
							filterableAttributes: ["id", "handle"],
						},
						primaryKey: "id",
						// Create your own transformer
						/*transformer: (product) => ({
              id: product.id,
              // other attributes...
            }),*/
					},
				},
			},
		},
	],
	modules: [
		{
			resolve: "@medusajs/medusa/cache-redis",
			options: {
				redisUrl: process.env.REDIS_URL,
			},
		},
		{
			resolve: "@medusajs/medusa/event-bus-redis",
			options: {
				redisUrl: process.env.REDIS_URL,
			},
		},
		{
			resolve: "@medusajs/medusa/workflow-engine-redis",
			options: {
				redis: {
					url: process.env.REDIS_URL,
				},
			},
		},
	],
	admin: {
		disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
	},
});
