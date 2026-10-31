# Event-Scoped RBAC Matrix

| Capability | Participant | Volunteer | Coordinator | Principal |
|---|---:|---:|---:|---:|
| View published event content | Yes | Yes | Yes | Yes |
| Manage own registration/team | Yes | No | No | Oversight |
| View participant data | Own/team only | Assigned room | Assigned rooms | Event |
| Record check-in | No | Assigned room | No | Approved override only |
| View rooms/teams | Own assignment | Assigned room | Assigned rooms | Event |
| Assign rooms/staff | No | No | No | Yes |
| Publish schedule/announcement/challenge | No | No | No | Yes |
| Grant/revoke memberships | No | No | No | Yes; last-principal protection |
| Read audit log | No | No | No | Event only |

Every protected request also checks active membership, object event, and room/team scope. URL or client-supplied role selection is never authority.
