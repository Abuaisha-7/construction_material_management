import {
    Request,
    Response
  } from "express";
  
  import {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deactivateProject
  } from "../services/project.service";
  
  export async function createProjectController(
    req: Request,
    res: Response
  ) {
    try {
      const project =
        await createProject(req.body);
  
      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project
      });
  
    } catch (error) {
  
      if (
        error instanceof Error &&
        error.message ===
          "PROJECT_CODE_ALREADY_EXISTS"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Project code already exists"
        });
      }
  
      console.error(error);
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to create project"
      });
    }
  }

  export async function getProjectsController(
    req: Request,
    res: Response
  ) {
    try {
  
      const search =
        req.query.search
          ? String(req.query.search)
          : undefined;
  
      const status =
        req.query.status
          ? String(req.query.status)
          : undefined;
  
      const page =
        Number(req.query.page) || 1;
  
      const limit =
        Number(req.query.limit) || 20;
  
      const result =
        await getProjects({
          search,
          status,
          page,
          limit
        });
  
      return res.json({
        success: true,
        data: result.projects,
        pagination:
          result.pagination
      });
  
    } catch (error) {
  
      console.error(error);
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch projects"
      });
    }
  }

  export async function getProjectController(
    req: Request,
    res: Response
  ) {
    try {
  
      const project =
        await getProjectById(
          req.params.id
        );
  
      return res.json({
        success: true,
        data: project
      });
  
    } catch (error) {
  
      if (
        error instanceof Error &&
        error.message ===
          "PROJECT_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }
  
      console.error(error);
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch project"
      });
    }
  }

  export async function updateProjectController(
    req: Request,
    res: Response
  ) {
    try {
  
      const project =
        await updateProject(
          req.params.id,
          req.body
        );
  
      return res.json({
        success: true,
        message:
          "Project updated successfully",
        data: project
      });
  
    } catch (error) {
  
      if (
        error instanceof Error &&
        error.message ===
          "PROJECT_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }
  
      console.error(error);
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to update project"
      });
    }
  }

  export async function deleteProjectController(
    req: Request,
    res: Response
  ) {
    try {
  
      await deactivateProject(
        req.params.id
      );
  
      return res.json({
        success: true,
        message:
          "Project cancelled successfully"
      });
  
    } catch (error) {
  
      if (
        error instanceof Error &&
        error.message ===
          "PROJECT_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Project not found"
        });
      }
  
      console.error(error);
  
      return res.status(500).json({
        success: false,
        message:
          "Failed to cancel project"
      });
    }
  }