import { Request, Response } from "express";
import { UserService } from "../../services/user/user.service";
import { createUserSchema } from "../../types/domain/user/user.validation";
import { HttpError } from "../../utils/http-error";

export class UserController {
  constructor(private readonly userService: UserService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        issues: parsed.error.issues,
      });
      return;
    }

    try {
      const user = await this.userService.create(parsed.data);
      res.status(201).json(user);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  private handleError(error: unknown, res: Response): void {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
