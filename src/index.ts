import { WorkerEntrypoint } from "cloudflare:workers"
import type { EventName } from "@workos-inc/node"
import type {
	CreateOrganizationOptions,
	CreateOrganizationRequestOptions,
	UpdateOrganizationOptions
} from "@workos-inc/node"
import { ProxyToSelf } from "workers-mcp"
import { listEvents } from "./workos/events"
import {
	createOrganization,
	deleteOrganization,
	getOrganization,
	listOrganizationRoles,
	listOrganizations,
	updateOrganization
} from "./workos/organizations"

export default class MyWorker extends WorkerEntrypoint<Env> {
	/**
	 * @ignore
	 **/
	async fetch(request: Request): Promise<Response> {
		return new ProxyToSelf(this).fetch(request)
	}

	/**
	 * List events from the WorkOS API.
	 * @param events {string} JSON string array of event types to filter by. Format: ["user.created", "user.deleted"]
	 * @param rangeStart {string} Optional timestamp to get events from.
	 * @param rangeEnd {string} Optional timestamp to get events until.
	 * @param limit {number} Optional limit on number of events to return.
	 * @param after {string} Optional cursor for pagination.
	 * @param organizationId {string} Optional organization ID to filter by.
	 * @return {Promise<any>} List of events matching the criteria.
	 */
	async listEvents(
		events: string,
		rangeStart?: string,
		rangeEnd?: string,
		limit?: number,
		after?: string,
		organizationId?: string
	) {
		// Parse the JSON string to get the array of event types
		const parsedEvents = JSON.parse(events) as EventName[]

		return await listEvents(
			this.env,
			parsedEvents,
			rangeStart,
			rangeEnd,
			limit,
			after,
			organizationId
		)
	}

	/**
	 * List organizations from the WorkOS API.
	 * @param domains {string} Optional JSON string array of domains to filter by. Format: ["example.com", "example.org"]
	 * @param limit {number} Optional limit on number of organizations to return (1-100, default 10).
	 * @param before {string} Optional cursor for pagination (getting previous results).
	 * @param after {string} Optional cursor for pagination (getting next results).
	 * @return {Promise<any>} List of organizations matching the criteria, including pagination metadata and organization objects with the following properties:
	 *  - id {string} - The organization's unique identifier
	 *  - name {string} - The organization's name
	 *  - allowProfilesOutsideOrganization {boolean} - Whether to allow profiles outside the organization
	 *  - domains {Array} - Array of domain objects associated with the organization
	 *  - stripeCustomerId {string|undefined} - Optional Stripe customer ID
	 *  - createdAt {string} - ISO timestamp of creation
	 *  - updatedAt {string} - ISO timestamp of last update
	 */
	async listOrganizations(
		domains?: string,
		limit?: number,
		before?: string,
		after?: string
	) {
		// Parse the JSON string to get the array of domains if provided
		const parsedDomains = domains
			? (JSON.parse(domains) as string[])
			: undefined

		return await listOrganizations(
			this.env,
			parsedDomains,
			limit,
			before,
			after
		)
	}

	/**
	 * Create a new organization in WorkOS.
	 * @param payload {string} JSON string with organization details. Format:
	 *  {
	 *    "name": "Acme Inc.", // Required: The organization's name
	 *    "domains": ["example.com"], // Optional: Array of domains to associate with the organization
	 *    "allowProfilesOutsideOrganization": false, // Optional: Whether to allow profiles outside of the organization (default: false)
	 *    "idempotencyKey": "unique-key-123" // Optional: A unique key to prevent duplicate organizations
	 *  }
	 * @param requestOptions {string} Optional JSON string with request options. Format:
	 *  {
	 *    "idempotencyKey": "unique-key-123" // Optional: A unique key to prevent duplicate requests
	 *  }
	 * @return {Promise<any>} The created organization with the following properties:
	 *  - id {string} - The organization's unique identifier
	 *  - name {string} - The organization's name
	 *  - allowProfilesOutsideOrganization {boolean} - Whether profiles outside the organization are allowed
	 *  - domains {Array} - Array of domain objects associated with the organization
	 *  - stripeCustomerId {string|undefined} - Optional Stripe customer ID
	 *  - createdAt {string} - ISO timestamp of creation
	 *  - updatedAt {string} - ISO timestamp of last update
	 */
	async createOrganization(payload: string, requestOptions?: string) {
		// Parse the JSON strings
		const parsedPayload = JSON.parse(payload) as CreateOrganizationOptions
		const parsedRequestOptions = requestOptions
			? (JSON.parse(requestOptions) as CreateOrganizationRequestOptions)
			: undefined

		return await createOrganization(
			this.env,
			parsedPayload,
			parsedRequestOptions
		)
	}

	/**
	 * Delete an organization from WorkOS.
	 * @param id {string} The ID of the organization to delete (format: "org_...").
	 * @return {Promise<any>} Confirmation of deletion with success status and the deleted organization ID.
	 */
	async deleteOrganization(id: string) {
		return await deleteOrganization(this.env, id)
	}

	/**
	 * Get an organization from WorkOS by ID.
	 * @param id {string} The ID of the organization to retrieve (format: "org_...").
	 * @return {Promise<any>} The organization details with the following properties:
	 *  - id {string} - The organization's unique identifier
	 *  - name {string} - The organization's name
	 *  - allowProfilesOutsideOrganization {boolean} - Whether profiles outside the organization are allowed
	 *  - domains {Array} - Array of domain objects associated with the organization
	 *  - stripeCustomerId {string|undefined} - Optional Stripe customer ID
	 *  - createdAt {string} - ISO timestamp of creation
	 *  - updatedAt {string} - ISO timestamp of last update
	 */
	async getOrganization(id: string) {
		return await getOrganization(this.env, id)
	}

	/**
	 * Update an organization in WorkOS.
	 * @param options {string} JSON string with update options. Format:
	 *  {
	 *    "organizationId": "org_123", // Required: The ID of the organization to update
	 *    "name": "New Name", // Optional: New name for the organization
	 *    "domains": ["new-domain.com"], // Optional: New array of domains (replaces existing domains)
	 *    "allowProfilesOutsideOrganization": true // Optional: Whether to allow profiles outside of the organization
	 *  }
	 * @return {Promise<any>} The updated organization with the following properties:
	 *  - id {string} - The organization's unique identifier
	 *  - name {string} - The organization's name (updated if changed)
	 *  - allowProfilesOutsideOrganization {boolean} - Whether profiles outside the organization are allowed (updated if changed)
	 *  - domains {Array} - Array of domain objects associated with the organization (updated if changed)
	 *  - stripeCustomerId {string|undefined} - Optional Stripe customer ID
	 *  - createdAt {string} - ISO timestamp of creation
	 *  - updatedAt {string} - ISO timestamp of last update
	 */
	async updateOrganization(options: string) {
		// Parse the JSON string
		const parsedOptions = JSON.parse(options) as UpdateOrganizationOptions

		return await updateOrganization(this.env, parsedOptions)
	}

	/**
	 * List roles for an organization in WorkOS.
	 * @param organizationId {string} The ID of the organization to list roles for (format: "org_...").
	 * @param limit {number} Optional limit on number of roles to return (1-100, default 10).
	 * @param after {string} Optional cursor for pagination (getting next results).
	 * @param before {string} Optional cursor for pagination (getting previous results).
	 * @return {Promise<any>} List of roles for the organization, including pagination metadata and role objects with:
	 *  - id {string} - The role's unique identifier
	 *  - name {string} - The role's name
	 *  - description {string} - Description of the role
	 *  - permissions {Array} - Array of permission strings associated with the role
	 *  - createdAt {string} - ISO timestamp of creation
	 *  - updatedAt {string} - ISO timestamp of last update
	 */
	async listOrganizationRoles(
		organizationId: string,
		limit?: number,
		after?: string,
		before?: string
	) {
		return await listOrganizationRoles(
			this.env,
			organizationId,
			limit,
			after,
			before
		)
	}
}
