import { Request, Response } from "express";
import { User } from "../db/entity/User";
import { CreatorProfile } from "../db/entity/CreatorProfile.entity";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";
import emailService from "../services/email.service";
import { generateVerificationToken } from "../utils/token.utils";
import { google } from "googleapis";

export class AuthController {
  public async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, firstname, lastname, birthday, gender, phone, city } = req.body;
      
      const firstName = firstname;
      const lastName = lastname;

      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({
          error: "Registration failed",
          message: "User with this email already exists",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User();
      user.email = email;
      user.password = hashedPassword;
      user.firstName = firstName;
      user.lastName = lastName;
      
      if (birthday) user.birthday = new Date(birthday);
      if (gender) user.gender = gender;
      if (phone) user.phone = phone;
      if (city) user.city = city;

      user.isVerified = true;  // auto verify
      user.verificationToken = generateVerificationToken();
      user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await user.save();
      
      // Send verification email
      // try {
      //   await emailService.sendVerificationEmail(
      //     user.email,
      //     user.verificationToken,
      //     user.firstName
      //   );
      // } catch (emailError) {
      //   console.error("Error sending verification email:", emailError);
      //   // Continue with registration even if email fails
      // }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: "1d" }
      );

      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday,
          gender: user.gender,
          phone: user.phone,
          city: user.city,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({
        error: "Registration failed",
        message: "Internal server error during registration",
      });
    }
  }

  // public async verifyEmail(req: Request, res: Response): Promise<Response> {
  //   try {
  //     const { token } = req.params;

  //     // Find user with the token
  //     const user = await User.findOne({ where: { verificationToken: token } });
  //     if (!user) {
  //       return res.status(400).json({
  //         error: "Verification failed",
  //         message: "Invalid or expired verification token",
  //       });
  //     }

  //     // Check if token has expired
  //     if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
  //       return res.status(400).json({
  //         error: "Verification failed",
  //         message: "Verification token has expired. Please request a new one.",
  //       });
  //     }

  //     // Update user verification status
  //     user.isVerified = true;
  //     user.verificationToken = undefined; // Clear the token after verification
  //     user.verificationTokenExpiry = null; // Clear the expiry
  //     await user.save();

  //     return res.status(200).json({
  //       message: "Email verification successful",
  //       user: {
  //         id: user.id,
  //         email: user.email,
  //         firstName: user.firstName,
  //         lastName: user.lastName,
  //         birthday: user.birthday,
  //         gender: user.gender,
  //         phone: user.phone,
  //         city: user.city,
  //         isVerified: user.isVerified,
  //         createdAt: user.createdAt,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Email verification error:", error);
  //     return res.status(500).json({
  //       error: "Verification failed",
  //       message: "Internal server error during verification",
  //     });
  //   }
  // }

  public async verifyEmail(req: Request, res: Response): Promise<Response> {
  return res.status(200).json({
    message: "Email verification is currently disabled."
  });
}


  // public async resendVerification(req: Request, res: Response): Promise<Response> {
  //   try {
  //     const { email } = req.body;

  //     // Find user by email
  //     const user = await User.findOne({ where: { email } });
  //     if (!user) {
  //       return res.status(400).json({
  //         error: "Verification failed",
  //         message: "User not found",
  //       });
  //     }

  //     // Check if already verified
  //     if (user.isVerified) {
  //       return res.status(400).json({
  //         error: "Verification failed",
  //         message: "Email is already verified",
  //       });
  //     }

  //     // Generate new token
  //     user.verificationToken = generateVerificationToken();
  //     // Set expiry to 24 hours
  //     user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  //     await user.save();

  //     // Send verification email
  //     await emailService.sendVerificationEmail(
  //       user.email,
  //       user.verificationToken,
  //       user.firstName
  //     );

  //     return res.status(200).json({
  //       message: "Verification email sent successfully",
  //     });
  //   } catch (error) {
  //     console.error("Resend verification error:", error);
  //     return res.status(500).json({
  //       error: "Verification failed",
  //       message: "Internal server error while sending verification email",
  //     });
  //   }
  // }

  public async resendVerification(req: Request, res: Response): Promise<Response> {
  return res.status(200).json({
    message: "Verification system is temporarily disabled.",
  });
}


  public async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid email or password",
        });
      }
      
      // if (!user.isVerified) {
      //   return res.status(401).json({
      //     error: "Authentication failed",
      //     message: "Email not verified. Please verify your email before logging in.",
      //     needsVerification: true,
      //   });
      // }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Authentication failed",
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday,
          gender: user.gender,
          phone: user.phone,
          city: user.city,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({
        error: "Authentication failed",
        message: "Internal server error during login",
      });
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(200).json({
          message: "If your email is registered, you will receive password reset instructions."
        });
      }
      const resetToken = generateVerificationToken();
      
      const resetExpiry = new Date();
      resetExpiry.setHours(resetExpiry.getHours() + 1);
      
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = resetExpiry;
      await user.save();

      try {
        await emailService.sendPasswordResetEmail(
          user.email,
          resetToken,
          user.firstName
        );
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        return res.status(500).json({
          error: "Password reset failed",
          message: "Error sending password reset email"
        });
      }

      return res.status(200).json({
        message: "If your email is registered, you will receive password reset instructions."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({
        error: "Password reset failed",
        message: "Internal server error during password reset request"
      });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({ 
        where: { 
          resetPasswordToken: token,
        }
      });

      if (!user) {
        return res.status(400).json({
          error: "Password reset failed",
          message: "Invalid or expired reset token"
        });
      }

      if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
        return res.status(400).json({
          error: "Password reset failed",
          message: "Reset token has expired"
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpiry = null;
      await user.save();

      return res.status(200).json({
        message: "Password has been reset successfully"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({
        error: "Password reset failed",
        message: "Internal server error during password reset"
      });
    }
  }

  public async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user as any;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to change your password",
        });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Password change failed",
          message: "Current password is incorrect",
        });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          error: "Password change failed",
          message: "New password must be different from current password",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({
        error: "Password change failed",
        message: "Internal server error during password change",
      });
    }
  }

  public async getGoogleAuthUrl(req: Request, res: Response): Promise<Response> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: ["openid", "profile", "email"],
      });
      return res.json({ url });
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  public async loginWithGoogle(req: Request, res: Response): Promise<Response> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          error: "Authentication failed",
          message: "Google ID token is required"
        });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      const ticket = await oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(400).json({
          error: "Authentication failed",
          message: "Invalid Google token"
        });
      }

      const { email, given_name, family_name, picture } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        user = new User();
        user.email = email;
        user.firstName = given_name || "User";
        user.lastName = family_name || "";
        user.password = await bcrypt.hash(Math.random().toString(36), 10); // Random password for OAuth users
        user.isVerified = true; // Google users are pre-verified
        user.verificationToken = undefined;

        await user.save();
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          birthday: user.birthday,
          gender: user.gender,
          phone: user.phone,
          city: user.city,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Google login error:", error);
      return res.status(500).json({
        error: "Authentication failed",
        message: "Internal server error during Google login"
      });
    }
  }

  public async updateAccountType(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const { accountType } = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to update your account type",
        });
      }

      const validAccountTypes = ["Individual", "Business", "Creator", "None"];
      if (!accountType || !validAccountTypes.includes(accountType)) {
        return res.status(400).json({
          error: "Invalid account type",
          message: `Account type must be one of: ${validAccountTypes.join(", ")}`,
        });
      }

      const userRecord = await User.findOne({ where: { id: user.id } });
      if (!userRecord) {
        return res.status(404).json({
          error: "User not found",
          message: "User record not found",
        });
      }

      userRecord.accountType = accountType;
      await userRecord.save();

      return res.status(200).json({
        message: "Account type updated successfully",
        user: {
          id: userRecord.id,
          email: userRecord.email,
          firstName: userRecord.firstName,
          lastName: userRecord.lastName,
          accountType: userRecord.accountType,
          isVerified: userRecord.isVerified,
          createdAt: userRecord.createdAt,
        },
      });
    } catch (error) {
      console.error("Update account type error:", error);
      return res.status(500).json({
        error: "Account type update failed",
        message: "Internal server error while updating account type",
      });
    }
  }

  /**
   * Get creator profile for authenticated user
   */
  public async getCreatorProfile(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in to view creator profile",
        });
      }

      // Find or create creator profile
      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });

      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
        await profile.save();
      }

      return res.status(200).json({
        message: "Creator profile retrieved",
        profile,
      });
    } catch (error) {
      console.error("Get creator profile error:", error);
      return res.status(500).json({
        error: "Failed to retrieve creator profile",
        message: "Internal server error",
      });
    }
  }

  /**
   * Update creator profile (basic info step: creatorname, about, main)
   */
  public async updateCreatorBasicInfo(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const { creatorname, about, main } = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in",
        });
      }

      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });
      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
      }

      if (creatorname !== undefined) profile.creatorname = creatorname;
      if (about !== undefined) profile.about = about;
      if (main !== undefined) profile.main = main;

      await profile.save();

      return res.status(200).json({
        message: "Creator basic info updated",
        profile,
      });
    } catch (error) {
      console.error("Update creator basic info error:", error);
      return res.status(500).json({
        error: "Failed to update creator profile",
        message: "Internal server error",
      });
    }
  }

  /**
   * Update creator profile (social media step)
   */
  public async updateCreatorSocialMedia(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const { followers, instagram, tiktok, twitter, youtube, linkedin, facebook, social } = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in",
        });
      }

      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });
      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
      }

      if (followers !== undefined) profile.followers = followers;
      if (instagram !== undefined) profile.instagram = instagram;
      if (tiktok !== undefined) profile.tiktok = tiktok;
      if (twitter !== undefined) profile.twitter = twitter;
      if (youtube !== undefined) profile.youtube = youtube;
      if (linkedin !== undefined) profile.linkedin = linkedin;
      if (facebook !== undefined) profile.facebook = facebook;
      if (social !== undefined) profile.social = social;

      await profile.save();

      return res.status(200).json({
        message: "Creator social media updated",
        profile,
      });
    } catch (error) {
      console.error("Update creator social media error:", error);
      return res.status(500).json({
        error: "Failed to update creator profile",
        message: "Internal server error",
      });
    }
  }

  /**
   * Update creator profile (experience step)
   */
  public async updateCreatorExperience(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const { experience, milestones, collabs } = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in",
        });
      }

      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });
      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
      }

      if (experience !== undefined) profile.experience = experience;
      if (milestones !== undefined) profile.milestones = milestones;
      if (collabs !== undefined) profile.collabs = collabs;

      await profile.save();

      return res.status(200).json({
        message: "Creator experience updated",
        profile,
      });
    } catch (error) {
      console.error("Update creator experience error:", error);
      return res.status(500).json({
        error: "Failed to update creator profile",
        message: "Internal server error",
      });
    }
  }

  /**
   * Update creator profile (categories & values step)
   */
  public async updateCreatorCategoriesValues(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const { category, subCategory, corevalue, coreValues, subCoreValues, topics } = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in",
        });
      }

      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });
      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
      }

      if (category !== undefined) profile.category = category;
      if (subCategory !== undefined) profile.subCategory = subCategory;
      if (corevalue !== undefined) profile.corevalue = corevalue;
      if (coreValues !== undefined) profile.coreValues = coreValues;
      if (subCoreValues !== undefined) profile.subCoreValues = subCoreValues;
      if (topics !== undefined) profile.topics = topics;

      await profile.save();

      return res.status(200).json({
        message: "Creator categories & values updated",
        profile,
      });
    } catch (error) {
      console.error("Update creator categories & values error:", error);
      return res.status(500).json({
        error: "Failed to update creator profile",
        message: "Internal server error",
      });
    }
  }

  /**
   * Update creator profile (profile media step: avatar, preview)
   */
  public async updateCreatorMedia(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const { avatar, preview } = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in",
        });
      }

      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });
      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
      }

      if (avatar !== undefined) profile.avatar = avatar;
      if (preview !== undefined) profile.preview = preview;

      await profile.save();

      return res.status(200).json({
        message: "Creator media updated",
        profile,
      });
    } catch (error) {
      console.error("Update creator media error:", error);
      return res.status(500).json({
        error: "Failed to update creator profile",
        message: "Internal server error",
      });
    }
  }

  /**
   * Update entire creator profile in one call
   */
  public async updateCreatorProfileFull(req: Request, res: Response): Promise<Response> {
    try {
      const user = req.user as any;
      const profileData = req.body;

      if (!user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "You must be logged in",
        });
      }

      let profile = await CreatorProfile.findOne({ where: { user: { id: user.id } } });
      if (!profile) {
        profile = new CreatorProfile();
        profile.user = user;
      }

      // Update all allowed fields
      const allowedFields = [
        "creatorname", "about", "main", "followers", "instagram", "tiktok", "twitter",
        "youtube", "linkedin", "facebook", "social", "experience", "milestones", "collabs",
        "category", "subCategory", "corevalue", "coreValues", "subCoreValues", "topics",
        "avatar", "preview",
      ];

      allowedFields.forEach((field) => {
        if (profileData[field] !== undefined) {
          (profile as any)[field] = profileData[field];
        }
      });

      await profile.save();

      return res.status(200).json({
        message: "Creator profile updated successfully",
        profile,
      });
    } catch (error) {
      console.error("Update creator profile full error:", error);
      return res.status(500).json({
        error: "Failed to update creator profile",
        message: "Internal server error",
      });
    }
  }
 
}