import { useRolesQuery } from "@/queries/roles"
import { RoleScope } from "@/types/roles"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MemberRoleSelectProps = {
  scope: RoleScope
  roleId: string
  roleName: string
  canManage: boolean
  disabled?: boolean
  onChange: (roleId: string) => void
}

/**
 * Renders a role badge for viewers, or an editable select for members who
 * can manage roles at this scope.
 */
export function MemberRoleSelect({
  scope,
  roleId,
  roleName,
  canManage,
  disabled,
  onChange,
}: MemberRoleSelectProps) {
  const { data: roles = [] } = useRolesQuery(scope)

  if (!canManage) {
    return <Badge variant="secondary">{roleName}</Badge>
  }

  return (
    <Select value={roleId} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
