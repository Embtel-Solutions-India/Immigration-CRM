import json
from pathlib import Path

# Subagent result for uncached files
chunk_1_json = """{
  "nodes": [
    {
      "id": "app_immigration_crm",
      "label": "ImmigrationCRM Portal",
      "file_type": "document"
    },
    {
      "id": "stack_react",
      "label": "React 18",
      "file_type": "code"
    },
    {
      "id": "stack_express",
      "label": "Express 4",
      "file_type": "code"
    },
    {
      "id": "stack_mongodb",
      "label": "MongoDB 8",
      "file_type": "code"
    },
    {
      "id": "stack_node",
      "label": "Node.js 24",
      "file_type": "code"
    },
    {
      "id": "stack_vite",
      "label": "Vite",
      "file_type": "code"
    },
    {
      "id": "stack_redux",
      "label": "Redux Toolkit",
      "file_type": "code"
    },
    {
      "id": "stack_mongoose",
      "label": "Mongoose ODM",
      "file_type": "code"
    },
    {
      "id": "stack_tailwind",
      "label": "Tailwind CSS",
      "file_type": "code"
    },
    {
      "id": "external_ghl",
      "label": "GoHighLevel CRM",
      "file_type": "document"
    },
    {
      "id": "external_nodemailer",
      "label": "Nodemailer SMTP",
      "file_type": "code"
    },
    {
      "id": "entity_user",
      "label": "User Entity",
      "file_type": "code"
    },
    {
      "id": "entity_workunit",
      "label": "WorkUnit Entity",
      "file_type": "code"
    },
    {
      "id": "entity_case",
      "label": "Case Entity",
      "file_type": "code"
    },
    {
      "id": "entity_kpi",
      "label": "KPI Target Entity",
      "file_type": "code"
    },
    {
      "id": "entity_notification",
      "label": "Notification Entity",
      "file_type": "code"
    },
    {
      "id": "entity_leavereq",
      "label": "Leave Request Entity",
      "file_type": "code"
    },
    {
      "id": "entity_activitylog",
      "label": "Activity Log Entity",
      "file_type": "code"
    },
    {
      "id": "entity_eodreport",
      "label": "EOD Report Entity",
      "file_type": "code"
    },
    {
      "id": "entity_webhooklog",
      "label": "Webhook Log Entity",
      "file_type": "code"
    },
    {
      "id": "entity_orgsettings",
      "label": "Organization Settings Entity",
      "file_type": "code"
    },
    {
      "id": "entity_auditlog",
      "label": "Audit Log Entity",
      "file_type": "code"
    },
    {
      "id": "middleware_auth",
      "label": "Authentication Middleware",
      "file_type": "code"
    },
    {
      "id": "middleware_role",
      "label": "Role Guard Middleware",
      "file_type": "code"
    },
    {
      "id": "middleware_teamscope",
      "label": "Team Scope Middleware",
      "file_type": "code"
    },
    {
      "id": "auth_jwt",
      "label": "JWT Token",
      "file_type": "code"
    },
    {
      "id": "ctrl_auth",
      "label": "Auth Controller",
      "file_type": "code"
    },
    {
      "id": "ctrl_user",
      "label": "User Controller",
      "file_type": "code"
    },
    {
      "id": "ctrl_workunit",
      "label": "WorkUnit Controller",
      "file_type": "code"
    },
    {
      "id": "ctrl_case",
      "label": "Case Controller",
      "file_type": "code"
    },
    {
      "id": "ctrl_kpi",
      "label": "KPI Controller",
      "file_type": "code"
    },
    {
      "id": "ctrl_eod",
      "label": "EOD Report Controller",
      "file_type": "code"
    },
    {
      "id": "ctrl_webhook",
      "label": "Webhook Controller",
      "file_type": "code"
    },
    {
      "id": "role_user",
      "label": "User Role",
      "file_type": "document"
    },
    {
      "id": "role_admin",
      "label": "Admin Role",
      "file_type": "document"
    },
    {
      "id": "role_superadmin",
      "label": "Superadmin Role",
      "file_type": "document"
    },
    {
      "id": "team_sales",
      "label": "Sales Team",
      "file_type": "document"
    },
    {
      "id": "team_marketing",
      "label": "Marketing Team",
      "file_type": "document"
    },
    {
      "id": "team_production",
      "label": "Production Team",
      "file_type": "document"
    },
    {
      "id": "workunit_sales",
      "label": "Sales Unit Type",
      "file_type": "code"
    },
    {
      "id": "workunit_marketing",
      "label": "Marketing Unit Type",
      "file_type": "code"
    },
    {
      "id": "workunit_production",
      "label": "Production Unit Type",
      "file_type": "code"
    },
    {
      "id": "service_email",
      "label": "Email Service",
      "file_type": "code"
    },
    {
      "id": "util_cronjob",
      "label": "Cron Job Scheduler",
      "file_type": "code"
    },
    {
      "id": "util_scorer",
      "label": "Score Calculator",
      "file_type": "code"
    },
    {
      "id": "client_layer",
      "label": "Client Layer",
      "file_type": "code"
    },
    {
      "id": "server_layer",
      "label": "Server Layer",
      "file_type": "code"
    },
    {
      "id": "db_layer",
      "label": "Database Layer",
      "file_type": "code"
    }
  ],
  "edges": [
    {
      "source": "app_immigration_crm",
      "target": "client_layer",
      "relation": "has frontend component",
      "confidence": "EXTRACTED"
    },
    {
      "source": "app_immigration_crm",
      "target": "server_layer",
      "relation": "has backend component",
      "confidence": "EXTRACTED"
    },
    {
      "source": "app_immigration_crm",
      "target": "db_layer",
      "relation": "persists data in",
      "confidence": "EXTRACTED"
    },
    {
      "source": "client_layer",
      "target": "stack_react",
      "relation": "built with",
      "confidence": "EXTRACTED"
    },
    {
      "source": "client_layer",
      "target": "stack_vite",
      "relation": "uses build tool",
      "confidence": "EXTRACTED"
    },
    {
      "source": "client_layer",
      "target": "stack_redux",
      "relation": "uses state management",
      "confidence": "EXTRACTED"
    },
    {
      "source": "client_layer",
      "target": "stack_tailwind",
      "relation": "styled with",
      "confidence": "EXTRACTED"
    },
    {
      "source": "server_layer",
      "target": "stack_express",
      "relation": "built with",
      "confidence": "EXTRACTED"
    },
    {
      "source": "server_layer",
      "target": "stack_node",
      "relation": "runs on",
      "confidence": "EXTRACTED"
    },
    {
      "source": "server_layer",
      "target": "stack_mongoose",
      "relation": "uses ODM",
      "confidence": "EXTRACTED"
    },
    {
      "source": "db_layer",
      "target": "stack_mongodb",
      "relation": "uses database",
      "confidence": "EXTRACTED"
    },
    {
      "source": "auth_jwt",
      "target": "middleware_auth",
      "relation": "validated by",
      "confidence": "EXTRACTED"
    },
    {
      "source": "middleware_auth",
      "target": "middleware_role",
      "relation": "precedes",
      "confidence": "INFERRED"
    },
    {
      "source": "ctrl_auth",
      "target": "auth_jwt",
      "relation": "generates",
      "confidence": "EXTRACTED"
    },
    {
      "source": "entity_user",
      "target": "middleware_auth",
      "relation": "managed by",
      "confidence": "INFERRED"
    },
    {
      "source": "ctrl_user",
      "target": "entity_user",
      "relation": "operates on",
      "confidence": "EXTRACTED"
    },
    {
      "source": "entity_user",
      "target": "role_user",
      "relation": "can have",
      "confidence": "INFERRED"
    },
    {
      "source": "entity_user",
      "target": "role_admin",
      "relation": "can have",
      "confidence": "INFERRED"
    },
    {
      "source": "entity_user",
      "target": "role_superadmin",
      "relation": "can have",
      "confidence": "INFERRED"
    },
    {
      "source": "ctrl_workunit",
      "target": "entity_workunit",
      "relation": "operates on",
      "confidence": "EXTRACTED"
    },
    {
      "source": "entity_workunit",
      "target": "team_sales",
      "relation": "assigned to",
      "confidence": "EXTRACTED"
    },
    {
      "source": "entity_workunit",
      "target": "team_marketing",
      "relation": "assigned to",
      "confidence": "EXTRACTED"
    },
    {
      "source": "entity_workunit",
      "target": "team_production",
      "relation": "assigned to",
      "confidence": "EXTRACTED"
    },
    {
      "source": "ctrl_case",
      "target": "entity_case",
      "relation": "operates on",
      "confidence": "EXTRACTED"
    },
    {
      "source": "ctrl_kpi",
      "target": "entity_kpi",
      "relation": "operates on",
      "confidence": "EXTRACTED"
    },
    {
      "source": "util_scorer",
      "target": "entity_kpi",
      "relation": "calculates",
      "confidence": "EXTRACTED"
    },
    {
      "source": "ctrl_eod",
      "target": "entity_eodreport",
      "relation": "generates",
      "confidence": "EXTRACTED"
    },
    {
      "source": "util_cronjob",
      "target": "ctrl_eod",
      "relation": "triggers",
      "confidence": "EXTRACTED"
    },
    {
      "source": "ctrl_webhook",
      "target": "entity_webhooklog",
      "relation": "logs events",
      "confidence": "EXTRACTED"
    },
    {
      "source": "service_email",
      "target": "external_nodemailer",
      "relation": "uses",
      "confidence": "EXTRACTED"
    },
    {
      "source": "entity_notification",
      "target": "service_email",
      "relation": "delivered via",
      "confidence": "INFERRED"
    },
    {
      "source": "external_ghl",
      "target": "client_layer",
      "relation": "integrated with",
      "confidence": "INFERRED"
    },
    {
      "source": "entity_activitylog",
      "target": "ctrl_user",
      "relation": "tracks",
      "confidence": "INFERRED"
    },
    {
      "source": "entity_auditlog",
      "target": "middleware_auth",
      "relation": "records",
      "confidence": "INFERRED"
    }
  ],
  "hyperedges": []
}"""

# Merge AST + cached + semantic
all_nodes = []
all_edges = []
all_hyperedges = []

# Load AST
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text())
all_nodes.extend(ast.get('nodes', []))
all_edges.extend(ast.get('edges', []))

# Load cached
cached_path = Path('graphify-out/.graphify_cached.json')
if cached_path.exists():
    cached = json.loads(cached_path.read_text())
    all_nodes.extend(cached.get('nodes', []))
    all_edges.extend(cached.get('edges', []))
    all_hyperedges.extend(cached.get('hyperedges', []))

# Load subagent chunk
chunk = json.loads(chunk_1_json)
all_nodes.extend(chunk.get('nodes', []))
all_edges.extend(chunk.get('edges', []))
all_hyperedges.extend(chunk.get('hyperedges', []))

merged = {'nodes': all_nodes, 'edges': all_edges, 'hyperedges': all_hyperedges, 'input_tokens': 0, 'output_tokens': 0}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2))
print(f'Merged: {len(all_nodes)} nodes, {len(all_edges)} edges')
