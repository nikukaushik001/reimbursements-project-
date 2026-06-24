CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reimbursements" (
	"id" serial PRIMARY KEY NOT NULL,
	"reimbursement_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"rm_approved" boolean DEFAULT false NOT NULL,
	"ape_approved" boolean DEFAULT false NOT NULL,
	"cfo_approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reimbursements_reimbursement_id_unique" UNIQUE("reimbursement_id")
);
--> statement-breakpoint
CREATE TABLE "employee_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_user_id" uuid NOT NULL,
	"rm_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_assignments_employee_user_id_unique" UNIQUE("employee_user_id")
);
--> statement-breakpoint
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_employee_user_id_users_user_id_fk" FOREIGN KEY ("employee_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_rm_user_id_users_user_id_fk" FOREIGN KEY ("rm_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;